import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("POST /users (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test("[POST] /users - creates a user when authenticated as an ADMIN", async () => {
    const user = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "John Doe",
        cpf: "267.859.975-26",
        email: "jonhdoe@example.com",
        password: "123456",
        role: "ADMIN",
      });

    expect(response.statusCode).toBe(201);

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: "jonhdoe@example.com",
      },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.role).toBe("ADMIN");
  });

  test("[POST] /users - returns 403 when the authenticated user is not an ADMIN", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Hacker User",
        cpf: "111.222.333-44",
        email: "hacker@example.com",
        password: "123456",
        role: "ADMIN",
      });

    expect(response.statusCode).toBe(403);
  });

  test("[POST] /users - returns 401 when no access token is provided", async () => {
    const response = await request(app.getHttpServer()).post("/users").send({
      name: "Anonymous User",
      cpf: "999.888.777-66",
      email: "anon@example.com",
      password: "123456",
      role: "RECIPIENT",
    });

    expect(response.statusCode).toBe(401);
  });
});
