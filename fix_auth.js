const fs = require('fs');
const files = [
  "src/app/api/settings/referral/route.ts",
  "src/app/api/settings/apply-access/route.ts",
  "src/app/api/logs/route.ts",
  "src/app/api/export/route.ts",
  "src/app/dashboard/page.tsx",
  "src/app/api/dashboard/analytics/route.ts",
  "src/app/api/dashboard/recharge/route.ts",
  "src/app/api/dashboard/ip-whitelist/route.ts",
  "src/app/api/dashboard/transactions/route.ts",
  "src/app/api/gpay-accounts/route.ts",
  "src/app/api/dashboard/webhooks/route.ts",
  "src/app/api/settings/route.ts",
  "src/app/api/payment-links/route.ts",
  "src/app/api/keys/route.ts",
  "src/app/api/dashboard/activity/route.ts"
];

let changedCount = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Pattern 1: Fallback block
  const fallbackRegex = /if\s*\(!merchantId\)\s*\{\s*const firstMerchant = await prisma\.merchant\.findFirst\(\{[\s\S]*?\}\);\s*merchantId = firstMerchant\?\.id;\s*\}/g;
  content = content.replace(fallbackRegex, "// Fallback removed for security");

  // Pattern 2: findFirst() -> findUnique() after session is added
  const missingSessionRegex = /(export\s+async\s+function\s+(?:GET|POST|PATCH|DELETE)\([^)]*\)\s*\{)\s*const\s+merchant\s*=\s*await\s+prisma\.merchant\.findFirst\((?:\{[^}]*\}\s*)?\);/g;
  
  if (missingSessionRegex.test(content)) {
     // Ensure getServerSession is imported
     if (!content.includes('getServerSession')) {
         content = content.replace('import { prisma } from "@/lib/prisma";', 'import { prisma } from "@/lib/prisma";\nimport { getServerSession } from "next-auth";\nimport { authOptions } from "@/lib/auth";');
     }
     
     content = content.replace(missingSessionRegex, (match, p1) => {
         return `${p1}
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });`;
     });
  }
  
  // Pattern 3: dashboard page.tsx
  if (file === "src/app/dashboard/page.tsx") {
    const dashboardRegex = /merchant = await prisma\.merchant\.findFirst\(\{[\s\S]*?\}\);/g;
    content = content.replace(dashboardRegex, 'merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId }, include: { agent: true } });');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
    changedCount++;
  }
}

console.log("Total files fixed: " + changedCount);
