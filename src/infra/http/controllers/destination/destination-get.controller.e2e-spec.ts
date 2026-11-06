import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("GET /destinations/:id (E2E)", () => {
  let app: INestApplication;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("[GET] /destinations/:id - gets a destination by ID when authenticated as an ADMIN", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.destination).toMatchObject({
      id: target.id.toString(),
    });
  });

  test("[GET] /destinations/:id - returns 403 when the authenticated user is not an ADMIN", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  test("[GET] /destinations/:id - returns 401 when no access token is provided", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer()).get(
      `/destinations/${target.id.toString()}`,
    );

    expect(response.statusCode).toBe(401);
  });

  test("[GET] /destinations/:id - returns 404 when the destination does not exist", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const nonExistentDestinationId = randomUUID();

    const response = await request(app.getHttpServer())
      .get(`/destinations/${nonExistentDestinationId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[GET] /destinations/:id - returns 400 when the provided ID is not a valid UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations/invalid-uuid-format`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });
});
