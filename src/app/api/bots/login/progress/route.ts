import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const logPath = path.join(process.cwd(), '.sessions', `session-${name}`, 'auto-login.log');

  try {
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ logs: [] });
    }
    
    // Read the file. If it gets too large, we should probably read the tail,
    // but for this auto-login script it'll be < 50 lines.
    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = content.split('\n').filter(l => l.trim() !== '');
    
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
