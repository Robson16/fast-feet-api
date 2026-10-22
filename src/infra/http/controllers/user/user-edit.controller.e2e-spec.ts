import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("PUT /users/:id (E2E)", () => {
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

  afterAll(async () => {
    await app.close();
  });

  test("updates a user when authenticated as an ADMIN", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const target = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated User",
        email: "updated-user@example.com",
        role: "RECIPIENT",
      });

    expect(response.statusCode, JSON.stringify(response.body)).toBe(204);

    const userOnDatabase = await prisma.user.findUnique({
      where: { id: target.id.toString() },
    });

    expect(userOnDatabase).toMatchObject({
      name: "Updated User",
      email: "updated-user@example.com",
      role: "RECIPIENT",
    });
  });

  test("returns 400 when the requested role is invalid", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const target = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "INVALID" });

    expect(response.statusCode).toBe(400);
  });

  test("returns 403 when the authenticated user is not an ADMIN", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const target = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Unauthorized Update" });

    expect(response.statusCode).toBe(403);
  });

  test("returns 401 when no access token is provided", async () => {
    const target = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .send({ name: "Anonymous Update" });

    expect(response.statusCode).toBe(401);
  });
});
