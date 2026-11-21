import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("List Destinations (E2E)", () => {
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

  it("should be able to list destinations ordered by most recent as an ADMIN", async () => {
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

    const destination3 = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      createdAt: new Date(2026, 0, 20),
    });
    const destination2 = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      createdAt: new Date(2026, 0, 18),
    });
    const destination1 = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      createdAt: new Date(2026, 0, 15),
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=1`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      destinations: [
        expect.objectContaining({ id: destination3.id.toString() }),
        expect.objectContaining({ id: destination2.id.toString() }),
        expect.objectContaining({ id: destination1.id.toString() }),
      ],
      page: 1,
      perPage: 20,
    });
  });

  it("should be able to fetch paginated destinations on page 2", async () => {
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

    await Promise.all(
      Array.from({ length: 23 }, () =>
        destinationFactory.makePrismaDestination({
          recipientId: recipient.id,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=2`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      page: 2,
      perPage: 20,
    });
    expect(response.body.destinations).toHaveLength(3);
  });

  it("should return an empty list when there are no destinations on the requested page", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=1`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      page: 1,
      perPage: 20,
    });
    expect(response.body.destinations).toHaveLength(0);
  });

  it("should return 400 when page query parameter is invalid", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=one`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  it("should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).get(
      `/destinations?page=1`,
    );

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 when authenticated as a DELIVERER", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=1`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 403 when authenticated as a RECIPIENT", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/destinations?page=1`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });
});
