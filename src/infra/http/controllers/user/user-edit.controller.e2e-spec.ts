import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
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

  test("[PUT] /users/:id - updates a user when authenticated as an ADMIN", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const target = await userFactory.makePrismaUser();

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

  test("[PUT] /users/:id - returns 409 when the CPF is already in use", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const target = await userFactory.makePrismaUser();
    const existingUser = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ cpf: existingUser.cpf.value });

    expect(response.statusCode).toBe(409);
  });

  test("[PUT] /users/:id - returns 409 when the email is already in use", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const target = await userFactory.makePrismaUser();
    const existingUser = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: existingUser.email });

    expect(response.statusCode).toBe(409);
  });

  test("[PUT] /users/:id - returns 400 when the id is not a UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .put("/users/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated User",
        email: "updated-user@example.com",
        role: "RECIPIENT",
      });

    expect(response.statusCode).toBe(400);
  });

  test("[PUT] /users/:id - returns 400 when the requested role is invalid", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const target = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "INVALID" });

    expect(response.statusCode).toBe(400);
  });

  test("[PUT] /users/:id - returns 403 when the authenticated user is not an ADMIN", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const target = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Unauthorized Update" });

    expect(response.statusCode).toBe(403);
  });

  test("[PUT] /users/:id - returns 401 when no access token is provided", async () => {
    const target = await userFactory.makePrismaUser();

    const response = await request(app.getHttpServer())
      .put(`/users/${target.id.toString()}`)
      .send({ name: "Anonymous Update" });

    expect(response.statusCode).toBe(401);
  });

  test("[PUT] /users/:id - returns 404 when user is not found", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const randomIdNotExistent = new UniqueEntityID();

    const response = await request(app.getHttpServer())
      .put(`/users/${randomIdNotExistent.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated User",
        email: "updated-user@example.com",
        role: "RECIPIENT",
      });

    expect(response.statusCode).toBe(404);
  });
});
