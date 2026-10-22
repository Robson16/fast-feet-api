import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { hash } from "bcryptjs";
import request from "supertest";
import { UserFactory } from "test/factories/user-factory";

import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("POST /sessions (E2E)", () => {
  let app: INestApplication;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  test("[POST] /sessions - should authenticate and return a JWT token", async () => {
    const fakeCPF = CPF.generate();
    const passwordHash = await hash("123456", 8);

    await userFactory.makePrismaUser({
      cpf: fakeCPF,
      password: passwordHash,
    });

    const response = await request(app.getHttpServer()).post("/sessions").send({
      cpf: fakeCPF.value,
      password: "123456",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });

  test("[POST] /sessions - should return 401 with wrong password", async () => {
    const fakeCPF = CPF.generate();
    const passwordHash = await hash("123456", 8);

    await userFactory.makePrismaUser({
      cpf: fakeCPF,
      password: passwordHash,
    });

    const response = await request(app.getHttpServer()).post("/sessions").send({
      cpf: fakeCPF.value,
      password: "wrong-password",
    });

    expect(response.statusCode).toBe(401);
  });

  test("[POST] /sessions - should return 401 with non-existent CPF", async () => {
    const fakeCPF = CPF.generate();

    const response = await request(app.getHttpServer()).post("/sessions").send({
      cpf: fakeCPF.value,
      password: "123456",
    });

    expect(response.statusCode).toBe(401);
  });
});
