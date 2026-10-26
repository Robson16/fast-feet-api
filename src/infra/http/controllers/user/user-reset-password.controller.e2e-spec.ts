import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { HashComparer } from "@/domain/user/application/cryptography/hash-comparer";
import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("PATCH /users/:id/password (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let jwt: JwtService;
  let hashGenerator: HashGenerator;
  let hashComparer: HashComparer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    jwt = moduleRef.get(JwtService);
    hashGenerator = moduleRef.get(HashGenerator);
    hashComparer = moduleRef.get(HashComparer);

    await app.init();
  });

  test("[PATCH] /users/:id/password - should allow ADMIN to reset a user password", async () => {
    const adminUser = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: adminUser.id.toString(),
      role: adminUser.role.value,
    });

    const oldPasswordHash = await hashGenerator.hash("old-password-123");
    const targetUser = await userFactory.makePrismaUser({
      password: oldPasswordHash,
    });

    const newPassword = "admin-forced-password";

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toString()}/password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        newPassword,
      });

    expect(response.statusCode).toBe(204);

    const targetUserOnDatabase = await prisma.user.findUnique({
      where: { id: targetUser.id.toString() },
    });

    expect(targetUserOnDatabase?.password).not.toEqual(oldPasswordHash);

    const isNewPasswordValid = await hashComparer.compare(
      newPassword,
      targetUserOnDatabase!.password,
    );
    expect(isNewPasswordValid).toBe(true);
  });

  test("[PATCH] /users/:id/password - should return 403 Forbidden if not ADMIN", async () => {
    const delivererUser = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const targetUser = await userFactory.makePrismaUser();

    const accessToken = jwt.sign({
      sub: delivererUser.id.toString(),
      role: delivererUser.role.value,
    });

    const response = await request(app.getHttpServer())
      .patch(`/users/${targetUser.id.toString()}/password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        newPassword: "any-password",
      });

    expect(response.statusCode).toBe(403);
  });

  test("[PATCH] /users/:id/password - should return 404 if target user does not exist", async () => {
    const adminUser = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: adminUser.id.toString(),
      role: adminUser.role.value,
    });

    const fakeUserId = randomUUID();

    const response = await request(app.getHttpServer())
      .patch(`/users/${fakeUserId}/password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        newPassword: "any-password",
      });

    expect(response.statusCode).toBe(404);
  });
});
