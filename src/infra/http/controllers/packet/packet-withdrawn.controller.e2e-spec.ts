import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { PacketFactory } from "test/factories/packet/packet-factory";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("Packet Withdrawal Controller (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let packetFactory: PacketFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory, PacketFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    packetFactory = moduleRef.get(PacketFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("[POST] /packets/:id/withdrawal - should be able to withdraw a packet as a DELIVERER", async () => {
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
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packet).toMatchObject({
      id: packet.id.toString(),
      destinationId: destination.id.toString(),
      delivererId: deliverer.id.toString(),
      status: "WITHDRAWN",
    });

    const packetOnDatabase = await prisma.packet.findUnique({
      where: { id: packet.id.toString() },
    });

    expect(packetOnDatabase).toMatchObject({
      id: packet.id.toString(),
      delivererId: deliverer.id.toString(),
      status: "WITHDRAWN",
    });
  });

  it("[POST] /packets/:id/withdrawal - should use delivererId from JWT and ignore request body", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const otherDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ delivererId: otherDeliverer.id.toString() });

    expect(response.statusCode).toBe(200);
    expect(response.body.packet.delivererId).toBe(deliverer.id.toString());
  });

  it("[POST] /packets/:id/withdrawal - should return 400 when id is not a valid UUID", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets/invalid-uuid/withdrawal")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  it("[POST] /packets/:id/withdrawal - should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).post(
      `/packets/${randomUUID()}/withdrawal`,
    );

    expect(response.statusCode).toBe(401);
  });

  it("[POST] /packets/:id/withdrawal - should return 403 when authenticated as an ADMIN", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("[POST] /packets/:id/withdrawal - should return 403 when authenticated as a RECIPIENT", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("[POST] /packets/:id/withdrawal - should return 404 when packet does not exist", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  it("[POST] /packets/:id/withdrawal - should return 409 when packet is already withdrawn", async () => {
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
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(409);
  });

  it("[POST] /packets/:id/withdrawal - should return 409 when packet is already delivered", async () => {
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
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "DELIVERED",
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/withdrawal`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(409);
  });
});
