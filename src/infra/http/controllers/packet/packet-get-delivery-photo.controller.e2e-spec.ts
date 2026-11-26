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
import { DELIVERY_PHOTO_URL_TTL_SECONDS } from "@/domain/order/application/use-cases/packet-get-delivery-photo.usecase";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("Get Packet Delivery Photo (E2E)", () => {
  let app: INestApplication;
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
    jwt = moduleRef.get(JwtService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    packetFactory = moduleRef.get(PacketFactory);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createDeliveredPacketWithPhoto() {
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
      status: "DELIVERED",
      deliveryPhotoKey: "photo-uuid-proof.jpg",
      deliveryPhotoMimeType: "image/jpeg",
      deliveryPhotoSize: 1024,
      deliveryPhotoUploadedAt: new Date(),
    });

    return { recipient, deliverer, destination, packet };
  }

  test("[GET] /packets/:id/delivery-photo - allows ADMIN to get signed URL", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      url: expect.stringContaining("photo-uuid-proof.jpg"),
      expiresIn: DELIVERY_PHOTO_URL_TTL_SECONDS,
    });
  });

  test("[GET] /packets/:id/delivery-photo - allows owner RECIPIENT to get signed URL", async () => {
    const { recipient, packet } = await createDeliveredPacketWithPhoto();

    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: "RECIPIENT",
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.url).toContain("photo-uuid-proof.jpg");
  });

  test("[GET] /packets/:id/delivery-photo - allows assigned DELIVERER to get signed URL", async () => {
    const { deliverer, packet } = await createDeliveredPacketWithPhoto();

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.url).toContain("photo-uuid-proof.jpg");
  });

  test("[GET] /packets/:id/delivery-photo - returns 404 for another RECIPIENT", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const otherRecipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const accessToken = jwt.sign({
      sub: otherRecipient.id.toString(),
      role: otherRecipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[GET] /packets/:id/delivery-photo - returns 404 for another DELIVERER", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const otherDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const accessToken = jwt.sign({
      sub: otherDeliverer.id.toString(),
      role: otherDeliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[GET] /packets/:id/delivery-photo - returns 404 when packet has no delivery photo", async () => {
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

    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${packet.id.toString()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[GET] /packets/:id/delivery-photo - returns 404 when packet does not exist", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get(`/packets/${randomUUID()}/delivery-photo`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[GET] /packets/:id/delivery-photo - returns 400 for invalid UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets/invalid-uuid/delivery-photo")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  test("[GET] /packets/:id/delivery-photo - returns 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).get(
      `/packets/${randomUUID()}/delivery-photo`,
    );

    expect(response.statusCode).toBe(401);
  });
});
