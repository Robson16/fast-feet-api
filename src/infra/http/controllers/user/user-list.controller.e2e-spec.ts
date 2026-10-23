import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("GET /users (E2E)", () => {
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

  test("returns a page of users to an ADMIN without exposing passwords", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    await Promise.all(
      Array.from({ length: 20 }, () => userFactory.makePrismaUser()),
    );
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/users?page=1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ page: 1, perPage: 20 });
    expect(response.body.users).toHaveLength(20);
    expect(response.body.users[0]).not.toHaveProperty("password");
  });

  test("rejects an invalid page", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/users?page=0")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  test("returns 403 to a non-admin user", async () => {
    const user = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  test("returns 401 when no access token is provided", async () => {
    const response = await request(app.getHttpServer()).get("/users");

    expect(response.statusCode).toBe(401);
  });
});
