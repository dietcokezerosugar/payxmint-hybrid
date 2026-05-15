import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting Clean Production Seed...");

  // 1. Create System Admin
  const adminEmail = "admin@wavecollect.com";
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: "ADMIN"
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN",
    },
  });

  console.log(`✅ Production Admin Created: ${admin.email}`);
  console.log("🚀 Database is now in a clean production state.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
