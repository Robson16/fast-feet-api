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

describe("List Packets Awaiting Withdrawal (E2E)", () => {
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

  test("[GET /packets/awaiting] allows ADMIN and DELIVERER and forbids RECIPIENT", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const adminToken = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });
    const delivererToken = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });
    const recipientToken = jwt.sign({
      sub: recipient.id.toString(),
      role: "RECIPIENT",
    });

    await request(app.getHttpServer())
      .get("/packets/awaiting")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get("/packets/awaiting")
      .set("Authorization", `Bearer ${delivererToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get("/packets/awaiting")
      .set("Authorization", `Bearer ${recipientToken}`)
      .expect(403);
  });

  test("[GET /packets/awaiting] lists only AWAITING_WITHDRAWAL packets filtered by address", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const targetDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Centro",
    });
    const otherDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "SP",
      addressCity: "Campinas",
      addressNeighborhood: "Cambuí",
    });

    const matchingPacket = packetMaker({
      destinationId: targetDestination.id,
      status: "AWAITING_WITHDRAWAL",
    });
    const wrongCityPacket = packetMaker({
      destinationId: otherDestination.id,
      status: "AWAITING_WITHDRAWAL",
    });
    const deliveredPacket = packetMaker({
      destinationId: targetDestination.id,
      status: "DELIVERED",
    });

    await packetsRepository.create(matchingPacket);
    await packetsRepository.create(wrongCityPacket);
    await packetsRepository.create(deliveredPacket);

    const token = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });

    const response = await request(app.getHttpServer())
      .get("/packets/awaiting")
      .query({ state: "sp", city: "jundiaí", neighborhood: "centro" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      packets: [
        expect.objectContaining({
          id: matchingPacket.id.toString(),
          status: "AWAITING_WITHDRAWAL",
        }),
      ],
      page: 1,
      perPage: DEFAULT_PER_PAGE,
    });
  });

  test("[GET /packets/awaiting] rejects unknown query parameters with 400", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const token = jwt.sign({
      sub: deliverer.id.toString(),
      role: "DELIVERER",
    });

    await request(app.getHttpServer())
      .get("/packets/awaiting")
      .query({ latitude: -23.1857 })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
