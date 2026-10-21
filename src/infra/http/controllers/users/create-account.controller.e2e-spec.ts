import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "@/infra/app.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("Create account (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  test("[POST] /accounts", async () => {
    const response = await request(app.getHttpServer()).post("/accounts").send({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
    });

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: "jonhdoe@example.com",
      },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.role).toBe("DELIVERER");
  });

  test("[POST] /accounts - should ignore role in payload and always create a DELIVERER", async () => {
    const response = await request(app.getHttpServer()).post("/accounts").send({
      name: "Admin Hacker",
      cpf: "267.859.975-26",
      email: "hacker@example.com",
      password: "123456",
      role: "ADMIN",
    });

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: "hacker@example.com",
      },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.role).toEqual("DELIVERER");
  });
});
