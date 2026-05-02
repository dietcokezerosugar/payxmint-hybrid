const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ACCOUNT_NAME = process.argv[2];
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];

if (!ACCOUNT_NAME || !EMAIL || !PASSWORD) {
    console.error("[ERROR] Missing arguments. Usage: node auto-login.js <name> <email> <password>");
    process.exit(1);
}

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

function log(msg) {
    console.log(`[PROGRESS] ${msg}`);
}

async function run() {
    log(`Booting automated login for ${ACCOUNT_NAME}...`);
    
    // Launch Playwright headful but we don't strictly need to be visible. 
    // However, Google login is less likely to block if it's a standard headful browser
    const chromePath = chromium.executablePath();
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: true, // We will run headless to keep it completely background
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1280,800'
        ],
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    
    log(`Navigating to Google Pay...`);
    await page.goto('https://pay.google.com/g4b/signup', { waitUntil: 'networkidle' });

    let loopCount = 0;
    const maxLoops = 20; // Prevent infinite loop
    let isLoggedIn = false;

    while (loopCount < maxLoops) {
        loopCount++;
        await page.waitForTimeout(2000); // Give page time to settle

        const currentUrl = page.url();
        log(`Current state: \${currentUrl.substring(0, 50)}...`);

        // Success Condition 1: We are on the transactions or signup page, and NOT the Google Accounts login page
        if (currentUrl.includes('pay.google.com/g4b/signup') || currentUrl.includes('pay.google.com/g4b/transactions')) {
            // Check if we are actually logged in (e.g. login button is missing)
            const loginBtn = await page.$('a[href*="accounts.google.com"]');
            if (loginBtn) {
                log(`Clicking initial sign in button...`);
                await loginBtn.click();
                continue;
            }
            
            // Check for Report ID auto-discovery
            try {
                await page.waitForURL(/BCR[A-Z0-9]{10,}/, { timeout: 5000 });
                const newUrl = page.url();
                const match = newUrl.match(/(BCR[A-Z0-9]{10,})/);
                if (match) {
                    log(`[SUCCESS] Auto-discovered Merchant ID: \${match[1]}`);
                    
                    // We can save this to the DB right here using an API call to Wave Collect
                    const axios = require('axios');
                    await axios.post('http://localhost:3000/api/bots/config', {
                        name: ACCOUNT_NAME,
                        report_id: match[1]
                    }).catch(e => log(`Failed to save report ID: \${e.message}`));
                }
            } catch(e) {} // Not a dealbreaker if we don't find it immediately

            log(`Successfully reached dashboard!`);
            isLoggedIn = true;
            break;
        }

        // Email Input
        const emailInput = await page.$('input[type="email"]');
        if (emailInput && await emailInput.isVisible()) {
            log(`Found email input. Typing email...`);
            await emailInput.fill(EMAIL);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
            continue;
        }

        // Password Input
        const passInput = await page.$('input[type="password"]');
        if (passInput && await passInput.isVisible()) {
            log(`Found password input. Typing password...`);
            await passInput.fill(PASSWORD);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(4000);
            continue;
        }

        // Handle various Google "Skip" / "Not Now" screens
        const buttonTexts = ['Not now', 'Skip', 'I understand', 'No thanks', 'Continue', 'Done'];
        let clickedSkip = false;
        
        for (const text of buttonTexts) {
            try {
                const btn = await page.getByRole('button', { name: text, exact: true });
                if (await btn.count() > 0 && await btn.first().isVisible()) {
                    log(`Clicking "\${text}" button to skip security/promo screen...`);
                    await btn.first().click();
                    clickedSkip = true;
                    await page.waitForTimeout(3000);
                    break;
                }
            } catch(e) {}
        }
        
        if (clickedSkip) continue;

        // If we are stuck on a screen requiring 2FA or phone verification
        if (await page.getByText('2-Step Verification').count() > 0 || await page.getByText('Verify it’s you').count() > 0) {
            log(`[WARNING] Google is requesting 2FA or manual verification. The automated login is blocked.`);
            log(`[WARNING] Please use the Manual Login fallback in the dashboard.`);
            break;
        }
        
        // If we get here, we might just be waiting for a redirect
    }

    if (isLoggedIn) {
        log(`[SUCCESS] Automated login complete! Session saved to VPS.`);
        await context.close();
        process.exit(0);
    } else {
        log(`[ERROR] Automated login failed. Please use Manual Login.`);
        await context.close();
        process.exit(1);
    }
}

run().catch(async (e) => {
    log(`[CRITICAL] Script crashed: \${e.message}`);
    process.exit(1);
});
