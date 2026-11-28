import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { packetMaker } from "test/factories/packet/packet-maker";
import { UserFactory } from "test/factories/user/user-factory";

import { DEFAULT_PER_PAGE } from "@/core/repositories/pagination-params";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";

describe("List Nearby Packets (E2E)", () => {
  let app: INestApplication;
  let jwt: JwtService;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let packetsRepository: PacketsRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    jwt = moduleRef.get(JwtService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    packetsRepository = moduleRef.get(PacketsRepository);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("[GET /deliverer/packets/nearby] allows DELIVERER and forbids ADMIN and RECIPIENT", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const delivererToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });
    const adminToken = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });
    const recipientToken = jwt.sign({
      sub: recipient.id.toString(),
      role: "RECIPIENT",
    });

    const query = { latitude: -23.1857, longitude: -46.8978 };

    await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .query(query)
      .set("Authorization", `Bearer ${delivererToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .query(query)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .query(query)
      .set("Authorization", `Bearer ${recipientToken}`)
      .expect(403);
  });

  test("[GET /deliverer/packets/nearby] lists only WITHDRAWN packets for the authenticated deliverer within distance", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const otherDeliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const nearbyDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      latitude: -23.1857,
      longitude: -46.8978,
    });
    const farDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      latitude: -23.0,
      longitude: -46.7,
    });

    const nearbyWithdrawnPacket = packetMaker({
      destinationId: nearbyDestination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
    const farWithdrawnPacket = packetMaker({
      destinationId: farDestination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
    const nearbyDeliveredPacket = packetMaker({
      destinationId: nearbyDestination.id,
      delivererId: deliverer.id,
      status: "DELIVERED",
    });
    const otherDelivererNearbyPacket = packetMaker({
      destinationId: nearbyDestination.id,
      delivererId: otherDeliverer.id,
      status: "WITHDRAWN",
    });

    await packetsRepository.create(nearbyWithdrawnPacket);
    await packetsRepository.create(farWithdrawnPacket);
    await packetsRepository.create(nearbyDeliveredPacket);
    await packetsRepository.create(otherDelivererNearbyPacket);

    const token = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });

    const response = await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .query({
        latitude: -23.186,
        longitude: -46.898,
        distance: 5000,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      packets: [
        expect.objectContaining({
          id: nearbyWithdrawnPacket.id.toString(),
          status: "WITHDRAWN",
          delivererId: deliverer.id.toString(),
        }),
      ],
      page: 1,
      perPage: DEFAULT_PER_PAGE,
    });
  });

  test("[GET /deliverer/packets/nearby] rejects missing coordinates or forbidden filters with 400", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const token = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });

    await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .get("/deliverer/packets/nearby")
      .query({
        latitude: -23.1857,
        longitude: -46.8978,
        city: "Jundiaí",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
