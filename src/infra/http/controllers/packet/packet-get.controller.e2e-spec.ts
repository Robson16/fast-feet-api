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

describe("Packet Get Controller (E2E)", () => {
  let app: INestApplication;
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

    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    packetFactory = moduleRef.get(PacketFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("[GET] /packets/:id - should be able to get any packet as an ADMIN", async () => {
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
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packet).toMatchObject({
      id: packet.id.toString(),
      destinationId: destination.id.toString(),
      recipientId: recipient.id.toString(),
      delivererId: null,
      status: "AWAITING_WITHDRAWAL",
      addressStreet: destination.addressStreet,
    });
  });

  it("[GET] /packets/:id - should be able to get a packet as its RECIPIENT", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      status: "WITHDRAWN",
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packet).toMatchObject({
      id: packet.id.toString(),
      destinationId: destination.id.toString(),
      recipientId: recipient.id.toString(),
      status: "WITHDRAWN",
    });
  });

  it("[GET] /packets/:id - should be able to get a packet as its assigned DELIVERER", async () => {
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
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packet).toMatchObject({
      id: packet.id.toString(),
      destinationId: destination.id.toString(),
      recipientId: recipient.id.toString(),
      delivererId: deliverer.id.toString(),
      status: "WITHDRAWN",
    });
  });

  it("[GET] /packets/:id - should return 400 when id is not a valid UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets/invalid-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  it("[GET] /packets/:id - should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).get(
      `/packets/${randomUUID()}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it("[GET] /packets/:id - should return 404 when packet does not exist", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  it("[GET] /packets/:id - should return 404 when a RECIPIENT tries to get another recipient's packet", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const otherRecipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const otherRecipientToken = jwt.sign({
      sub: otherRecipient.id.toString(),
      role: otherRecipient.role.value,
    });

    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${otherRecipientToken}`);

    expect(response.statusCode).toBe(404);
  });

  it("[GET] /packets/:id - should return 404 when a DELIVERER tries to get a packet assigned to another deliverer", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const otherDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const otherDelivererToken = jwt.sign({
      sub: otherDeliverer.id.toString(),
      role: otherDeliverer.role.value,
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
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${otherDelivererToken}`);

    expect(response.statusCode).toBe(404);
  });

  it("[GET] /packets/:id - should return 404 when a DELIVERER tries to get an unassigned packet", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const delivererToken = jwt.sign({
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
      .get(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${delivererToken}`);

    expect(response.statusCode).toBe(404);
  });
});
