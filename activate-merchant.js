const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const merchant = await prisma.merchant.findFirst();
  if (merchant) {
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { status: 'ACTIVE', walletBalance: 1000 }
    });
    console.log("Merchant activated and funded!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
