const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { parseTransactions } = require('./parser');

process.env.PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW = '1';

const ACCOUNT_NAME = process.argv[2];
if (!ACCOUNT_NAME) { console.error('Required bot name via args'); process.exit(1); }

// Stable deterministic port based on account name
const BOT_PORT = 5000 + (parseInt(Buffer.from(ACCOUNT_NAME).toString('hex').slice(0, 4), 16) % 1000);

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
const DOWNLOAD_DIR = path.join(__dirname, `../../.downloads/${ACCOUNT_NAME}`);

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

let accountConfig = { report_id: null, download_interval_sec: 40, email: '' };
let engineContext = null;
let enginePage = null;
let engineRunning = false;
let isInitialLoad = true;
const knownTransactions = new Set();

let statsEngineA = { captured: 0, lastCapture: null };
let statsEngineB = { captured: 0, lastCapture: null, lastDownload: null };

const app = express();
app.use(express.json());

let uiClients = [];
function log(msg) { 
    console.log(`[${new Date().toISOString()}] [${ACCOUNT_NAME}] ${msg}`); 
    let safeMsg = `[${ACCOUNT_NAME}] ${msg}`.replace(/\n/g, '<br>');
    uiClients.forEach(client => client.write(`data: ${safeMsg}\n\n`));
}

// Fetch config from Wave Collect
async function fetchConfig() {
    try {
        const res = await axios.get(`http://localhost:3000/api/bots/config?name=${encodeURIComponent(ACCOUNT_NAME)}`);
        if (res.data.data) {
            accountConfig = res.data.data;
        }
    } catch (e) {
        log(`Failed to fetch config from hub: ${e.message}`);
    }
}

// Update report_id in Wave Collect
async function updateReportId(reportId) {
    try {
        await axios.post('http://localhost:3000/api/bots/config', {
            name: ACCOUNT_NAME,
            report_id: reportId
        });
        log(`[SYSTEM] 🎯 Auto-discovered & saved Merchant ID: ${reportId}`);
        accountConfig.report_id = reportId;
    } catch (e) {
        log(`Failed to save Merchant ID: ${e.message}`);
    }
}

app.get('/api/control/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    uiClients.push(res);
    res.write(`data: [SYSTEM] Dual-Engine stream for ${ACCOUNT_NAME}...<br>\n\n`);
    req.on('close', () => uiClients = uiClients.filter(c => c !== res));
});

function normalizeFromXHR(trx) {
    const amt = parseFloat(trx.amount) || 0;
    return {
        externalId: trx.merchantTransactionId || '',
        utr: trx.utr || null,
        payerName: trx.payerName || 'Unknown',
        amount: amt,
        payerUpiId: trx.payerUpiId || null,
        timestamp: trx.timestamp || new Date().toISOString(),
        note: trx.note || null
    };
}

async function syncToHub(rows, engine) {
    if (!rows || rows.length === 0) return;
    try {
        const res = await axios.post('http://localhost:3000/api/v1/report', {
            account: ACCOUNT_NAME,
            timestamp: new Date().toISOString(),
            transactions: rows
        }, { timeout: 15000 });
        log(`[${engine}] Synced ${rows.length} rows → Hub acknowledged`);
    } catch (e) {
        log(`[${engine}] Hub sync failed: ${e.message}`);
    }
}

async function processEngineA(payload) {
    if (!payload || payload.length === 0) return;

    const exportRows = payload.map(trx => normalizeFromXHR(trx));
    const newOnes = payload.filter(t => !knownTransactions.has(t.merchantTransactionId));
    for (const trx of payload) { knownTransactions.add(trx.merchantTransactionId); }

    if (newOnes.length > 0) {
        await syncToHub(exportRows, 'ENGINE-A');
        statsEngineA.captured += newOnes.length;
        statsEngineA.lastCapture = new Date().toISOString();

        for (const trx of newOnes) {
            log(`[ENGINE-A] ⚡ NEW: ₹${trx.amount} from ${trx.payerName} | ${trx.note}`);
        }
    } else if (isInitialLoad) {
        log(`[ENGINE-A] Initial load: ${exportRows.length} transactions processed`);
    }
    isInitialLoad = false;
}

function parseCSV(text) {
    const results = [];
    const lines = text.split(/\\r?\\n/);
    if (lines.length < 1) return results;

    const headers = lines[0].replace(/^\\ufeff/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const row = {};
        headers.forEach((header, idx) => { row[header] = values[idx] || ''; });
        
        // Map CSV headers to Wave Collect expected format
        results.push({
            externalId: row['Transaction ID'] || '',
            payerName: row['Payer name'] || row['Payer'] || 'Unknown',
            amount: parseFloat(row['Amount']) || 0,
            payerUpiId: row['Paid via'] || null,
            timestamp: row['Creation time'] || new Date().toISOString(),
            note: row['Notes'] || null
        });
    }
    return results;
}

async function runEngineB() {
    if (!engineRunning || !enginePage) return;

    try {
        const reportUrl = `https://pay.google.com/g4b/reports/${accountConfig.report_id}`;
        const reportPage = await engineContext.newPage();
        
        try {
            await reportPage.goto(reportUrl, { timeout: 30000, waitUntil: 'load' });
            await reportPage.waitForTimeout(3000);

            await reportPage.evaluate(() => {
                const radio = document.querySelector('input[type="radio"][value="today"]');
                if (radio && !radio.checked) radio.click();
            });
            await reportPage.waitForTimeout(1500);

            const btnLocator = reportPage.locator('button:has-text("Download report")');
            const count = await btnLocator.count();

            if (count === 0) {
                log('[ENGINE-B] No download button found');
                await reportPage.close();
                return;
            }

            const oldFiles = fs.readdirSync(DOWNLOAD_DIR);
            for (const file of oldFiles) fs.unlinkSync(path.join(DOWNLOAD_DIR, file));

            log('[ENGINE-B] 📄 Initiating CSV download...');
            await reportPage.getByRole('button', { name: /download/i }).first().click();

            const downloadPromise = reportPage.waitForEvent('download', { timeout: 15000 }).catch(() => null);
            const modalPromise = reportPage.waitForSelector('text=CSV', { timeout: 5000 }).catch(() => null);
            const firstAction = await Promise.race([downloadPromise, modalPromise]);

            let downloadObj;
            if (firstAction && !firstAction.saveAs) {
                await reportPage.getByText('CSV').click(); 
                await reportPage.waitForTimeout(1000);
                const finalBtn = reportPage.getByRole('button', { name: /download/i }).last();
                [downloadObj] = await Promise.all([
                    reportPage.waitForEvent('download', { timeout: 30000 }),
                    finalBtn.click()
                ]);
            } else if (firstAction) {
                downloadObj = firstAction;
            } else {
                log('[ENGINE-B] Download timeout');
                await reportPage.close();
                return;
            }

            const dlPath = path.join(DOWNLOAD_DIR, \`report_\${Date.now()}.csv\`);
            await downloadObj.saveAs(dlPath);

            const csvText = fs.readFileSync(dlPath, 'utf-8');
            const rows = parseCSV(csvText);
            
            log(\`[ENGINE-B] 📄 CSV captured: \${rows.length} rows\`);
            
            await syncToHub(rows, 'ENGINE-B'); 
            statsEngineB.captured += rows.length;
            statsEngineB.lastDownload = new Date().toISOString();

            await downloadObj.delete().catch(() => {});
            
        } finally {
            await reportPage.close().catch(() => {});
        }

    } catch (e) {
        log(\`[ENGINE-B] CSV cycle error: \${e.message}\`);
    }
}

async function runDualPollingLoop() {
    if (!engineRunning) return;
    try {
        log('[DUAL] 🔄 Sweep cycle starting...');
        
        await enginePage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        log('[ENGINE-A] ⚡ XHR sweep complete');

        if (statsEngineB.captured === 0 || Math.random() < 0.3) {
            await runEngineB();
        }
        
        setTimeout(runDualPollingLoop, (accountConfig.download_interval_sec || 40) * 1000);
    } catch(e) {
        log(\`[CRASH] Playwright stalled: \${e.message}. Auto-recovering...\`);
        engineRunning = false;
        try { await engineContext.close(); } catch(x){}
        engineContext = null; enginePage = null;
        setTimeout(async () => { engineRunning = true; await bootEngine(); }, 5000);
    }
}

async function bootEngine() {
    await fetchConfig();
    let merchantUrl = 'https://pay.google.com/g4b/signup';
    if (accountConfig.report_id) {
        merchantUrl = \`https://pay.google.com/g4b/transactions/\${accountConfig.report_id}\`;
    }

    try {
        log(\`🚀 Booting Dual-Engine for \${ACCOUNT_NAME}...\`);

        const lockPath = path.join(SESSION_DIR, 'SingletonLock');
        const lockFile = path.join(SESSION_DIR, 'lockfile');
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
        if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

        const chromePath = require('playwright').chromium.executablePath();

        engineContext = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: false,
            executablePath: chromePath,
            acceptDownloads: true,
            downloadsPath: DOWNLOAD_DIR,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--headless=new',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-sandbox'
            ]
        });

        enginePage = await engineContext.newPage();

        await engineContext.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'media', 'font'].includes(type)) return route.abort();
            return route.continue();
        });

        enginePage.on('response', async response => {
            if (response.url().includes('batchexecute') && response.url().includes('RPtkab')) {
                try {
                    if (response.status() === 200) {
                        const body = await response.text();
                        processEngineA(parseTransactions(body));
                    }
                } catch (err) {}
            }
        });

        try {
            await enginePage.goto(merchantUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            try {
                await enginePage.waitForURL(/BCR[A-Z0-9]{10,}/, { timeout: 15000 });
            } catch(e) { } 

            const currentUrl = enginePage.url();
            const match = currentUrl.match(/(BCR[A-Z0-9]{10,})/);
            
            if (match && match[1]) {
                if (accountConfig.report_id !== match[1]) {
                    await updateReportId(match[1]);
                }
                
                if (!currentUrl.includes('/transactions')) {
                    log('[SYSTEM] Routing to transactions view...');
                    await enginePage.goto(\`https://pay.google.com/g4b/transactions/\${accountConfig.report_id}\`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                } else {
                    log(\`[SYSTEM] Anchored to transactions page\`);
                }
            } else {
                log(\`[WARNING] Could not auto-discover Merchant ID. URL: \${currentUrl}\`);
                if (!accountConfig.report_id) {
                    log('[ERROR] Missing Merchant ID and auto-discovery failed. Please login.');
                    engineRunning = false;
                    return false;
                }
            }
        } catch (e) { log(\`[WARNING] Page goto: \${e.message}\`); }

        log('[SYSTEM] ⚡ Engine A — ARMED');
        log('[SYSTEM] 📄 Engine B — ARMED');
        setTimeout(runDualPollingLoop, (accountConfig.download_interval_sec || 40) * 1000);
        return true;
    } catch (e) {
        log(\`[CRITICAL] Boot failed: \${e.message}\`);
        engineRunning = false; return false;
    }
}

app.post('/internal/wakeup', async (req, res) => {
    log('[WAKEUP] Multi-stage sweep initiated!');
    res.json({ ok: true });
    if (!engineRunning || !enginePage) return;

    setTimeout(async () => {
        if (!engineRunning) return;
        try {
            log('[WAKEUP] Sweep #1');
            await enginePage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
            
            setTimeout(async () => {
                await runEngineB();
            }, 3000);

            setTimeout(async () => {
                if (!engineRunning) return;
                try {
                    log('[WAKEUP] Sweep #2');
                    await enginePage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
                } catch(e) { log(\`[WAKEUP] Sweep #2 error: \${e.message}\`); }
            }, 7000);
        } catch(e) { log(\`[WAKEUP] Sweep #1 error: \${e.message}\`); }
    }, 2000);
});

app.get('/internal/stats', (req, res) => {
    res.json({ engineA: statsEngineA, engineB: statsEngineB, known: knownTransactions.size });
});

app.listen(BOT_PORT, async () => {
    log(\`Dual-Engine Wakeup Receiver on port \${BOT_PORT}\`);
    engineRunning = true;
    await bootEngine();
});

async function handleShutdown() {
    log(\`Terminating dual-engine...\`);
    if (engineContext) await engineContext.close().catch(() => {});
    process.exit(0);
}
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
