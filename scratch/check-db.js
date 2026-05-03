const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const merchants = await prisma.merchant.findMany();
  console.log('Merchants:', merchants.length);
  merchants.forEach(m => console.log(`- ${m.id}: ${m.name} (${m.email})`));

  const accounts = await prisma.googlePayAccount.findMany();
  console.log('GPay Accounts:', accounts.length);
  accounts.forEach(a => console.log(`- ${a.id}: ${a.name} (Merchant: ${a.merchantId}) Status: ${a.status}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
