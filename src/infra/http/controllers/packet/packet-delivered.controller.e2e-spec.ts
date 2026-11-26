import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { PacketFactory } from "test/factories/packet/packet-factory";
import { UserFactory } from "test/factories/user/user-factory";
import { FakeStorageProvider } from "test/storage/fake-storage-provider";

import { StorageProvider } from "@/domain/order/application/storage/storage-provider";
import { MAX_DELIVERY_PHOTO_SIZE_BYTES } from "@/domain/order/application/storage/validate-delivery-photo";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("Deliver Packet (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let packetFactory: PacketFactory;
  let fakeStorageProvider: FakeStorageProvider;

  beforeAll(async () => {
    fakeStorageProvider = new FakeStorageProvider();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory, PacketFactory],
    })
      .overrideProvider(StorageProvider)
      .useValue(fakeStorageProvider)
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    packetFactory = moduleRef.get(PacketFactory);

    await app.init();
  });

  beforeEach(() => {
    fakeStorageProvider.items = [];
    fakeStorageProvider.deletedKeys = [];
    fakeStorageProvider.shouldFailUpload = false;
  });

  afterAll(async () => {
    await app.close();
  });

  test("[POST] /packets/:id/delivered - marks packet as delivered with a valid photo", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(200);
    expect(fakeStorageProvider.items).toHaveLength(1);

    const packetOnDatabase = await prisma.packet.findUnique({
      where: { id: packet.id.toString() },
    });

    expect(packetOnDatabase).toMatchObject({
      status: "DELIVERED",
      deliveryPhotoKey: fakeStorageProvider.items[0].key,
      deliveryPhotoMimeType: "image/jpeg",
      deliveryPhotoSize: validJpegBuffer.length,
    });
    expect(packetOnDatabase?.deliveryPhotoUploadedAt).toBeInstanceOf(Date);
  });

  test("[POST] /packets/:id/delivered - returns 400 when photo is missing", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  test("[POST] /packets/:id/delivered - returns 400 when file is not a valid image", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("not an image", "utf-8"), "fake.jpg");

    expect(response.statusCode).toBe(400);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  test("[POST] /packets/:id/delivered - returns 413 when file exceeds 5 MB", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const oversizedBuffer = Buffer.alloc(MAX_DELIVERY_PHOTO_SIZE_BYTES + 1);
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", oversizedBuffer, "huge.jpg");

    expect(response.statusCode).toBe(413);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  test("[POST] /packets/:id/delivered - returns 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/delivered`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(401);
  });

  test("[POST] /packets/:id/delivered - returns 403 for non-DELIVERER role", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(403);
  });

  test("[POST] /packets/:id/delivered - returns 403 when another deliverer tries to deliver", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const assignedDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const otherDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      delivererId: assignedDeliverer.id,
      status: "WITHDRAWN",
    });

    const accessToken = jwt.sign({
      sub: otherDeliverer.id.toString(),
      role: otherDeliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(403);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  test("[POST] /packets/:id/delivered - returns 404 when packet does not exist", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${randomUUID()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(404);
  });

  test("[POST] /packets/:id/delivered - returns 409 when packet is not WITHDRAWN", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post(`/packets/${packet.id.toString()}/delivered`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(409);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  test("[POST] /packets/:id/delivered - returns 400 for invalid UUID", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/packets/invalid-uuid/delivered")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", validJpegBuffer, "proof.jpg");

    expect(response.statusCode).toBe(400);
  });
});
