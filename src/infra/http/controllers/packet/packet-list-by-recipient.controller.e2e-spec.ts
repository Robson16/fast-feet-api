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

  test("[GET] /packets - should list recipient's own packets", async () => {
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
    const packet1 = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
    });
    const packet2 = await packetFactory.makePrismaPacket({
      destinationId: destination.id,
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
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.packets).toHaveLength(2);
    expect(response.body.packets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: packet1.id.toString() }),
        expect.objectContaining({ id: packet2.id.toString() }),
      ]),
    );
  });

  test("[GET] /packets - should block unauthenticated requests", async () => {
    const response = await request(app.getHttpServer()).get("/packets").send();

    expect(response.statusCode).toBe(401);
  });

  test("[GET] /packets - should block unauthorized roles (e.g. DELIVERER)", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const accessToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: deliverer.role.value,
    });

    const response = await request(app.getHttpServer())
      .get("/packets")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(403);
  });
});
