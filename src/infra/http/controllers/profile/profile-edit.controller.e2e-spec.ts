import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("PUT /profile (E2E)", () => {
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

  test("[PUT] /profile - should edit authenticated user profile", async () => {
    const user = await userFactory.makePrismaUser({
      name: "Old Name",
      email: "old@example.com",
    });

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .put("/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "New Name",
        email: "new@example.com",
      });

    expect(response.statusCode).toBe(204);

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        id: user.id.toString(),
      },
    });

    expect(userOnDatabase).toBeTruthy();
    expect(userOnDatabase?.name).toBe("New Name");
    expect(userOnDatabase?.email).toBe("new@example.com");
  });

  test("[PUT] /profile - should return 400 with invalid email format", async () => {
    const user = await userFactory.makePrismaUser();

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .put("/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "invalid-email-format",
      });

    expect(response.statusCode).toBe(400);
  });

  test("[PUT] /profile - should return 401 Unauthorized if no token is provided", async () => {
    const response = await request(app.getHttpServer()).put("/profile").send({
      name: "Hacker User",
    });

    expect(response.statusCode).toBe(401);
  });
});
