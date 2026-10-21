import { execSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env" });
config({ path: ".env.test.local", override: true });

let prisma: PrismaClient;
let pool: Pool;

beforeAll(async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL must be set in .env.test.local");
  }

  const databaseName = new URL(connectionString).pathname.slice(1);

  if (!databaseName.endsWith("-test")) {
    throw new Error("E2E tests require a dedicated database ending in '-test'");
  }

  pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({ adapter });

  execSync("npx prisma migrate deploy", { env: process.env });
});

beforeEach(async () => {
  await prisma.packet.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});
