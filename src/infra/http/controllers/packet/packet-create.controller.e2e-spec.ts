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

describe("Packet Create Controller (E2E)", () => {
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

  it("[POST] /packets - should be able to create a packet as an ADMIN with AWAITING_WITHDRAWAL status", async () => {
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
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .post("/packets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        destinationId: destination.id.toString(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.packet).toMatchObject({
      destinationId: destination.id.toString(),
      status: "AWAITING_WITHDRAWAL",
    });

    const packetOnDatabase = await prisma.packet.findUnique({
      where: {
        id: response.body.packet.id,
      },
    });

    expect(packetOnDatabase).toBeTruthy();
    expect(packetOnDatabase).toMatchObject({
      destinationId: destination.id.toString(),
      status: "AWAITING_WITHDRAWAL",
    });
  });

  it("[POST] /packets - should return 400 when destinationId is invalid", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        destinationId: "invalid-destination-id",
      });

    expect(response.statusCode).toBe(400);
  });

  it("[POST] /packets - should return 404 when destination does not exist", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        destinationId: randomUUID(),
      });

    expect(response.statusCode).toBe(404);
  });

  it("[POST] /packets - should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).post("/packets");

    expect(response.statusCode).toBe(401);
  });

  it("[POST] /packets - should return 403 when authenticated as a DELIVERER", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("[POST] /packets - should return 403 when authenticated as a RECIPIENT", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });
});
