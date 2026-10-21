import process from "node:process";

import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
