import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "@/infra/app.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("POST /accounts (E2E)", () => {
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

  test("[POST] /accounts - creates a DELIVERER account by default", async () => {
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

  test("[POST] /accounts - assigns DELIVERER when the request asks for ADMIN", async () => {
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

  test("[POST] /accounts - assigns DELIVERER when the request asks for RECIPIENT", async () => {
    const response = await request(app.getHttpServer()).post("/accounts").send({
      name: "Recipient Hacker",
      cpf: "267.859.975-26",
      email: "recipient-hacker@example.com",
      password: "123456",
      role: "RECIPIENT",
    });

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: "recipient-hacker@example.com",
      },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.role).toBe("DELIVERER");
  });
});
