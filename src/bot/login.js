const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ACCOUNT_NAME = process.argv[2];
if (!ACCOUNT_NAME) {
    console.error("Account name required");
    process.exit(1);
}

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

async function run() {
    console.log(`Starting headful login for ${ACCOUNT_NAME}`);
    const chromePath = chromium.executablePath();
    
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: false,
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
        ]
    });

    const page = await context.newPage();
    await page.goto('https://pay.google.com/g4b/signup');

    // Wait for the browser to be closed by the user
    context.on('close', () => {
        console.log("Login window closed.");
        process.exit(0);
    });
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
