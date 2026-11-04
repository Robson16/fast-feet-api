import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { HashComparer } from "@/domain/user/application/cryptography/hash-comparer";
import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("PATCH /profile/password (E2E)", () => {
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

  test("[PATCH] /profile/password - should only change the authenticated user's password", async () => {
    const currentPassword = "old-password-123";
    const newPassword = "new-password-321";
    const currentPasswordHash = await hashGenerator.hash(currentPassword);
    const authenticatedUser = await userFactory.makePrismaUser({
      password: currentPasswordHash,
    });

    const accessToken = jwt.sign({
      sub: authenticatedUser.id.toString(),
      role: authenticatedUser.role.value,
    });

    const otherUserPasswordHash = await hashGenerator.hash(
      "other-user-password",
    );
    const otherUser = await userFactory.makePrismaUser({
      password: otherUserPasswordHash,
    });

    const response = await request(app.getHttpServer())
      .patch("/profile/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        userId: otherUser.id.toString(),
        currentPassword,
        newPassword,
      });

    expect(response.statusCode).toBe(204);

    const authenticatedUserOnDatabase = await prisma.user.findUnique({
      where: { id: authenticatedUser.id.toString() },
    });
    const otherUserOnDatabase = await prisma.user.findUnique({
      where: { id: otherUser.id.toString() },
    });

    expect(authenticatedUserOnDatabase?.password).not.toEqual(
      currentPasswordHash,
    );

    const isNewPasswordValid = await hashComparer.compare(
      newPassword,
      authenticatedUserOnDatabase!.password,
    );

    expect(isNewPasswordValid).toBe(true);
    expect(otherUserOnDatabase?.password).toEqual(otherUserPasswordHash);
  });

  test("[PATCH] /profile/password - should reject a new password shorter than six characters", async () => {
    const currentPassword = "old-password-123";
    const passwordHash = await hashGenerator.hash(currentPassword);
    const user = await userFactory.makePrismaUser({
      password: passwordHash,
    });
    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .patch("/profile/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword,
        newPassword: "12345",
      });

    expect(response.statusCode).toBe(400);
    const userOnDatabase = await prisma.user.findUnique({
      where: { id: user.id.toString() },
    });
    expect(userOnDatabase?.password).toBe(passwordHash);
  });

  test("[PATCH] /profile/password - should return 401 with wrong current password", async () => {
    const passwordHash = await hashGenerator.hash("old-password-123");
    const user = await userFactory.makePrismaUser({
      password: passwordHash,
    });

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .patch("/profile/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "wrong-current-password",
        newPassword: "new-password-321",
      });

    expect(response.statusCode).toBe(401);
  });

  test("[PATCH] /profile/password - should return 401 if no token is provided", async () => {
    const response = await request(app.getHttpServer())
      .patch("/profile/password")
      .send({
        currentPassword: "old-password-123",
        newPassword: "new-password-321",
      });

    expect(response.statusCode).toBe(401);
  });
});
