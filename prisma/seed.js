const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting Seed...");
  
  // Clean start
  await prisma.user.deleteMany({});
  await prisma.merchant.deleteMany({});

  // 1. Create System Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@wavecollect.com',
      password: 'admin_password', // In production, use hashed passwords
      name: 'Wave Admin',
      role: 'ADMIN'
    }
  });

  // 2. Create Initial Merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Sudarshan Merchant',
      businessName: 'Wave Collect Demo',
      email: 'solanatech24@gmail.com',
      status: 'ACTIVE',
      walletBalance: 500.0,
      commissionRate: 2.5,
      users: {
        create: {
          email: 'solanatech24@gmail.com',
          password: 'merchant_password',
          name: 'Sudarshan A S',
          role: 'MERCHANT'
        }
      }
    }
  });

  console.log(`Seed Success! Admin: ${admin.email}, Merchant: ${merchant.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
