import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("GET /users/:id (E2E)", () => {
  let app: INestApplication;
  let userFactory: UserFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    userFactory = moduleRef.get(UserFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("returns the requested user to an ADMIN without exposing the password", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const target = await userFactory.makePrismaUser({ name: "Target User" });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toMatchObject({
      id: target.id.toString(),
      name: "Target User",
      cpf: target.cpf.value,
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("returns 403 to a non-admin user", async () => {
    const user = await userFactory.makePrismaUser();
    const target = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  test("returns 401 when no access token is provided", async () => {
    const target = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer()).get(
      `/users/${target.id.toString()}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
