import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Ramada Hotel database...");

  const adminRole = await prisma.role.upsert({
    where: { roleId: 1 },
    update: {},
    create: { roleName: "Admin" },
  });

  await prisma.role.upsert({
    where: { roleId: 2 },
    update: {},
    create: { roleName: "Cashier" },
  });

  const passwordHash = await bcrypt.hash("Admin123", 10);
  const answerHash = await bcrypt.hash("admin", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      fullName: "System Administrator",
      username: "admin",
      passwordHash,
      roleId: adminRole.roleId,
      securityQuestion: "Magaca hooyadaa ugu horeysay?",
      securityAnswerHash: answerHash,
      allowedModules: "",
    },
  });

  console.log("✅ Done. Login with username: admin / password: Admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
