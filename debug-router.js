const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) return console.log("No merchant");

  const apiKey = await prisma.apiKey.findFirst({
    where: { merchantId: merchant.id, isBlocked: false },
  });

  const accounts = await prisma.googlePayAccount.findMany({
    where: { merchantId: merchant.id }
  });

  console.log("Merchant:", merchant.name);
  console.log("API Key:", apiKey?.key);
  console.log("GPay Accounts:");
  accounts.forEach(a => console.log(`  - ${a.name}: status=${a.status}, min=${a.minTicket}, max=${a.maxTicket}, daily=${a.dailyLimit}, current=${a.currentDaily}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
