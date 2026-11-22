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

describe("Packet Delete Controller (E2E)", () => {
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

  it("[DELETE] /packets/:id - should be able to delete a packet as an ADMIN", async () => {
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
    });

    const response = await request(app.getHttpServer())
      .delete(`/packets/${packet.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(204);

    const packetOnDatabase = await prisma.packet.findUnique({
      where: {
        id: packet.id.toString(),
      },
    });

    expect(packetOnDatabase).toBeNull();
  });

  it("[DELETE] /packets/:id - should return 400 when id is not a valid UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .delete("/packets/invalid-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  it("[DELETE] /packets/:id - should return 404 when packet does not exist", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .delete(`/packets/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  it("[DELETE] /packets/:id - should return 401 when unauthenticated", async () => {
    const response = await request(app.getHttpServer()).delete(
      `/packets/${randomUUID()}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it("[DELETE] /packets/:id - should return 403 when authenticated as a DELIVERER", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .delete(`/packets/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("[DELETE] /packets/:id - should return 403 when authenticated as a RECIPIENT", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .delete(`/packets/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });
});
