const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const key = await prisma.apiKey.findFirst();
  console.log(key ? key.key : "No key found");
  await prisma.$disconnect();
}

main();
