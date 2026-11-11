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
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("PUT /destinations/:id (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("[PUT] /destinations/:id - should edit a destination when authenticated as an ADMIN", async () => {
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
      .put(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Title",
      });

    expect(response.statusCode).toBe(204);

    const destinationOnDatabase = await prisma.destination.findUnique({
      where: { id: target.id.toString() },
    });

    expect(destinationOnDatabase).toMatchObject({
      title: "New Title",
    });
  });

  test("[PUT] /destinations/:id - should return 403 when the authenticated user is not an ADMIN", async () => {
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
      .put(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Title",
      });

    expect(response.statusCode).toBe(403);

    const destinationOnDatabase = await prisma.destination.findUnique({
      where: { id: target.id.toString() },
    });

    expect(destinationOnDatabase?.title).toBe(target.title);
  });

  test("[PUT] /destinations/:id - should return 401 when no access token is provided", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .put(`/destinations/${target.id.toString()}`)
      .send({
        title: "New Title",
      });

    expect(response.statusCode).toBe(401);
  });

  test("[PUT] /destinations/:id - should return 404 when the destination does not exist", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const nonExistentRecipientId = randomUUID();

    const response = await request(app.getHttpServer())
      .put(`/destinations/${nonExistentRecipientId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Title",
      });

    expect(response.statusCode).toBe(404);
  });

  test("[PUT] /destinations/:id - should return 400 when the provided ID is not a valid UUID", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/destinations/not-a-uuid`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Title",
      });

    expect(response.statusCode).toBe(400);
  });

  test("[PUT] /destinations/:id - should return 400 with invalid payload data", async () => {
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
      .put(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Title",
        addressZipCode: "invalid-zip-code",
      });

    expect(response.statusCode).toBe(400);
  });
});
