import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("POST /auth (E2E)", () => {
  let app: INestApplication;
  let userFactory: UserFactory;
  let hashGenerator: HashGenerator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    userFactory = moduleRef.get(UserFactory);
    hashGenerator = moduleRef.get(HashGenerator);

    await app.init();
  });

  test("[POST] /auth - should authenticate and return a JWT token", async () => {
    const fakeCPF = CPF.generate();
    const passwordHash = await hashGenerator.hash("123456");

    await userFactory.makePrismaUser({
      cpf: fakeCPF,
      password: passwordHash,
    });

    const response = await request(app.getHttpServer()).post("/auth").send({
      cpf: fakeCPF.value,
      password: "123456",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });

  test("[POST] /auth - should return 401 with wrong password", async () => {
    const fakeCPF = CPF.generate();
    const passwordHash = await hashGenerator.hash("123456");

    await userFactory.makePrismaUser({
      cpf: fakeCPF,
      password: passwordHash,
    });

    const response = await request(app.getHttpServer()).post("/auth").send({
      cpf: fakeCPF.value,
      password: "wrong-password",
    });

    expect(response.statusCode).toBe(401);
  });

  test("[POST] /auth - should return 401 with non-existent CPF", async () => {
    const fakeCPF = CPF.generate();

    const response = await request(app.getHttpServer()).post("/auth").send({
      cpf: fakeCPF.value,
      password: "123456",
    });

    expect(response.statusCode).toBe(401);
  });
});
