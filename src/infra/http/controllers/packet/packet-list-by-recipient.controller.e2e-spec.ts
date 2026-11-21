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

describe("Packet List By Recipient Controller (E2E)", () => {
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

  it("[GET] /packets - should list recipient's own packets ordered by most recent using default page", async () => {
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

    const olderPacket = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      createdAt: new Date(2026, 0, 15),
    });
    const newestPacket = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
      createdAt: new Date(2026, 0, 20),
    });

    const otherRecipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const otherDestination = await destinationFactory.makePrismaDestination({
      recipientId: otherRecipient.id,
    });
    await packetFactory.makePrismaPacket({
      destinationId: otherDestination.id,
    });

    const response = await request(app.getHttpServer())
      .get("/packets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packets).toHaveLength(2);
    expect(response.body.packets).toEqual([
      expect.objectContaining({ id: newestPacket.id.toString() }),
      expect.objectContaining({ id: olderPacket.id.toString() }),
    ]);
  });

  it("[GET] /packets - should fetch paginated packets on page 2", async () => {
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

    await Promise.all(
      Array.from({ length: 22 }, () =>
        packetFactory.makePrismaPacket({
          destinationId: destination.id,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .get("/packets?page=2")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packets).toHaveLength(2);
  });

  it("[GET] /packets - should return an empty list when recipient has no packets", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const accessToken = jwt.sign({
      sub: recipient.id.toString(),
      role: recipient.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets?page=1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.packets).toHaveLength(0);
  });

  it.each(["0", "-1", "1.5", "abc"])(
    "[GET] /packets - should return 400 when page query parameter is invalid (%s)",
    async (invalidPage) => {
      const recipient = await userFactory.makePrismaUser({
        role: Role.create("RECIPIENT"),
      });
      const accessToken = jwt.sign({
        sub: recipient.id.toString(),
        role: recipient.role.value,
      });

      const response = await request(app.getHttpServer())
        .get(`/packets?page=${invalidPage}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(400);
    },
  );

  it("[GET] /packets - should block unauthenticated requests", async () => {
    const response = await request(app.getHttpServer()).get("/packets");

    expect(response.statusCode).toBe(401);
  });

  it("[GET] /packets - should block unauthorized roles (DELIVERER)", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });

  it("[GET] /packets - should block unauthorized roles (ADMIN)", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);
  });
});
