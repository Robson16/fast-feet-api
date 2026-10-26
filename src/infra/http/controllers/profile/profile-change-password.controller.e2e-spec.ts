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

  test("[PATCH] /profile/password - should change authenticated user password", async () => {
    const currentPassword = "old-password-123";
    const newPassword = "new-password-321";

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
        newPassword,
      });

    expect(response.statusCode).toBe(204);

    const userOnDatabase = await prisma.user.findUnique({
      where: { id: user.id.toString() },
    });

    expect(userOnDatabase?.password).not.toEqual(passwordHash);

    const isNewPasswordValid = await hashComparer.compare(
      newPassword,
      userOnDatabase!.password,
    );

    expect(isNewPasswordValid).toBe(true);
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
