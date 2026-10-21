import "dotenv/config";

import process from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (adminExists) {
    console.log("✅ Administrator already exists in the database.");
    return;
  }

  const adminPassword = process.env.APP_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "APP_ADMIN_PASSWORD must be set to create the initial administrator.",
    );
  }

  const passwordHash = await hash(adminPassword, 8);

  await prisma.user.create({
    data: {
      name: "Admin Master",
      email: "admin@fastfeet.com",
      cpf: "503.664.350-00",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("🚀 Master administrator created successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
