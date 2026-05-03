const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

async function main() {
  const link = await prisma.paymentLink.findFirst();
  if (!link) return console.log("No links found");

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: link.apiKeyId },
    include: { merchant: true }
  });

  console.log("Link Amount:", link.amount);
  console.log("API Key valid:", !!apiKey);
  console.log("Merchant balance:", apiKey.merchant.walletBalance);

  const amount = link.amount;
  
  // ── GatewayRouter Logic ──
  const accounts = await prisma.googlePayAccount.findMany({
    where: {
      merchantId: link.merchantId,
      status: "ACTIVE",
      minTicket: { lte: amount },
      maxTicket: { gte: amount },
    },
  });

  console.log("Accounts found for amount", amount, ":", accounts.length);
  if (accounts.length > 0) {
      console.log("Valid accounts filter:");
      const validAccounts = accounts.filter((acc) => {
        const dailyOk = acc.dailyLimit === 0 || acc.currentDaily + amount <= acc.dailyLimit;
        const weeklyOk = acc.weeklyLimit === 0 || acc.currentWeekly + amount <= acc.weeklyLimit;
        const monthlyOk = acc.monthlyLimit === 0 || acc.currentMonthly + amount <= acc.monthlyLimit;
        return dailyOk && weeklyOk && monthlyOk;
      });
      console.log("After valid filter:", validAccounts.length);
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
