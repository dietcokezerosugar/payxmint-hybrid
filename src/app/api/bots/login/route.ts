import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { name, action, email, password } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const pm2Name = `gpay-${name}`;

    // Stop bot if running
    try {
      await execAsync(`pm2 stop "${pm2Name}"`);
    } catch (e) {}

    let scriptToRun = './src/bot/login.js';
    let args = [name];

    if (action === 'auto') {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required for auto login" }, { status: 400 });
      }
      scriptToRun = './src/bot/auto-login.js';
      args = [name, email, password];
    }
    
    // Redirect stdio to a log file for auto-login progress streaming
    const fs = require('fs');
    const sessionDir = path.join(process.cwd(), '.sessions', `session-${name}`);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    const logPath = path.join(sessionDir, 'auto-login.log');
    if (action === 'auto') {
      fs.writeFileSync(logPath, '[SYSTEM] Booting automated login...\n'); // Clear previous
    }

    const out = fs.openSync(logPath, 'a');
    const err = fs.openSync(logPath, 'a');

    // Spawn it detached so the API can return immediately
    const child = spawn('node', [scriptToRun, ...args], {
      detached: true,
      stdio: ['ignore', out, err]
    });
    child.unref();

    return NextResponse.json({ status: "success", message: "Login browser launched." });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
