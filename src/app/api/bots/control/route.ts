import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let action = searchParams.get("action");
    let name = "";

    try {
      const body = await req.json();
      if (body.action) action = body.action;
      if (body.name) name = body.name;
    } catch (e) {
      // Body might be empty, which is fine if action is in query
    }
    if (action === "status") {
      try {
        const { stdout } = await execAsync(`pm2 jlist`);
        const list = JSON.parse(stdout);
        const bots: Record<string, string> = {};
        
        list.forEach((p: any) => {
          if (p.name.startsWith('gpay-')) {
            const accName = p.name.replace('gpay-', '');
            bots[accName] = p.pm2_env.status;
          }
        });
        
        return NextResponse.json({ bots });
      } catch (e: any) {
        return NextResponse.json({ bots: {} }); // PM2 might not be running or list is empty
      }
    }

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const pm2Name = `gpay-${name}`;
    const botPath = path.join(process.cwd(), 'src', 'bot', 'bot.js');

    switch (action) {
      case "start":
        await execAsync(`pm2 start "${botPath}" --name "${pm2Name}" -- "${name}"`);
        break;
      case "stop":
        await execAsync(`pm2 stop "${pm2Name}"`);
        break;
      case "restart":
        await execAsync(`pm2 restart "${pm2Name}"`);
        break;
      case "delete":
        await execAsync(`pm2 delete "${pm2Name}"`);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("PM2 Control Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
