import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EnvService } from "@/infra/env/env.service";

describe("GET /profile (E2E)", () => {
  let app: INestApplication;
  let env: EnvService;
  let prisma: PrismaService;
  let jwt: JwtService;
  let jwtWithoutExpiry: JwtService;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    env = moduleRef.get(EnvService);
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    userFactory = moduleRef.get(UserFactory);

    jwtWithoutExpiry = new JwtService({
      privateKey: Buffer.from(env.get("JWT_PRIVATE_KEY"), "base64"),
      signOptions: { algorithm: "RS256" },
    });

    await app.init();
  });

  test("[GET] /profile", async () => {
    const user = await userFactory.makePrismaUser({
      name: "John Doe",
      email: "johndoe@example.com",
    });

    const accessToken = jwt.sign({ sub: user.id.toString() });

    const response = await request(app.getHttpServer())
      .get("/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        name: "John Doe",
        email: "johndoe@example.com",
      }),
    );
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  test("[GET] /profile - should return 401 with an expired token", async () => {
    const user = await userFactory.makePrismaUser();
    const expiredToken = jwt.sign(
      { sub: user.id.toString() },
      { expiresIn: -1 },
    );

    const response = await request(app.getHttpServer())
      .get("/profile")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.statusCode).toBe(401);
  });

  test("[GET] /profile - should return 401 with a token without expiration", async () => {
    const user = await userFactory.makePrismaUser();
    const tokenWithoutExpiry = jwtWithoutExpiry.sign({
      sub: user.id.toString(),
    });

    expect(jwt.decode(tokenWithoutExpiry)).not.toHaveProperty("exp");

    const response = await request(app.getHttpServer())
      .get("/profile")
      .set("Authorization", `Bearer ${tokenWithoutExpiry}`);

    expect(response.statusCode).toBe(401);
  });

  test("[GET] /profile - should return 401 when the token's user has been deleted", async () => {
    const user = await userFactory.makePrismaUser();
    const accessToken = jwt.sign({ sub: user.id.toString() });

    await prisma.user.delete({
      where: { id: user.id.toString() },
    });

    const response = await request(app.getHttpServer())
      .get("/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(401);
  });
});
