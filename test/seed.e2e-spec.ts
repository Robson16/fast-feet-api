import { execSync } from "node:child_process";

import { compare } from "bcryptjs";

import { PrismaService } from "@/infra/database/prisma/prisma.service";

const adminEmail = "admin@fastfeet.com";

function runSeed(adminPassword: string) {
  const env = {
    ...process.env,
    APP_ADMIN_PASSWORD: adminPassword,
  };

  try {
    const output = execSync("npm run prisma:seed", {
      encoding: "utf8",
      env,
    });

    return { exitCode: 0, output };
  } catch (error) {
    const commandError = error as {
      status?: number | null;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };

    return {
      exitCode: commandError.status ?? 1,
      output: `${commandError.stdout?.toString() ?? ""}${commandError.stderr?.toString() ?? ""}`,
    };
  }
}

describe("Prisma seed (E2E)", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates the initial administrator with a hashed password", async () => {
    const password = "initial-admin-password";
    const result = runSeed(password);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain(
      "Master administrator created successfully",
    );

    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    expect(admin).not.toBeNull();
    expect(admin?.password).not.toBe(password);
    expect(await compare(password, admin!.password)).toBe(true);
  });

  test("does not duplicate or modify an administrator on repeated runs", async () => {
    const firstResult = runSeed("first-admin-password");
    expect(firstResult.exitCode).toBe(0);

    const adminBefore = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });

    await prisma.user.update({
      where: { id: adminBefore.id },
      data: { name: "Preserved administrator" },
    });

    const secondResult = runSeed("different-admin-password");
    expect(secondResult.exitCode).toBe(0);
    expect(secondResult.output).toContain("Administrator already exists");

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    expect(admins).toHaveLength(1);
    expect(admins[0].name).toBe("Preserved administrator");
    expect(admins[0].password).toBe(adminBefore.password);
  }, 15_000);

  test("fails clearly when no password is configured and no administrator exists", async () => {
    const result = runSeed("");

    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain(
      "APP_ADMIN_PASSWORD must be set to create the initial administrator.",
    );
    expect(
      await prisma.user.findUnique({ where: { email: adminEmail } }),
    ).toBeNull();
  });
});
