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

describe("List Packets Admin (E2E)", () => {
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

  test("[GET /admin/packets] allows ADMIN and forbids DELIVERER and RECIPIENT", async () => {
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
      .get("/admin/packets")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get("/admin/packets")
      .set("Authorization", `Bearer ${delivererToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get("/admin/packets")
      .set("Authorization", `Bearer ${recipientToken}`)
      .expect(403);
  });

  test("[GET /admin/packets] filters packets by combined status, delivererId, recipientId, and address", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const deliverer1 = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const deliverer2 = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const recipient1 = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const recipient2 = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const targetDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient1.id,
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Centro",
    });
    const otherDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient2.id,
      addressState: "MG",
      addressCity: "Belo Horizonte",
      addressNeighborhood: "Savassi",
    });

    const matchingPacket = packetMaker({
      destinationId: targetDestination.id,
      delivererId: deliverer1.id,
      status: "DELIVERED",
    });
    const wrongStatusPacket = packetMaker({
      destinationId: targetDestination.id,
      delivererId: deliverer1.id,
      status: "WITHDRAWN",
    });
    const wrongDelivererPacket = packetMaker({
      destinationId: targetDestination.id,
      delivererId: deliverer2.id,
      status: "DELIVERED",
    });
    const wrongDestinationPacket = packetMaker({
      destinationId: otherDestination.id,
      delivererId: deliverer1.id,
      status: "DELIVERED",
    });

    await packetsRepository.create(matchingPacket);
    await packetsRepository.create(wrongStatusPacket);
    await packetsRepository.create(wrongDelivererPacket);
    await packetsRepository.create(wrongDestinationPacket);

    const token = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });

    const response = await request(app.getHttpServer())
      .get("/admin/packets")
      .query({
        status: "DELIVERED",
        delivererId: deliverer1.id.toString(),
        recipientId: recipient1.id.toString(),
        state: "sp",
        city: "jundiaí",
        neighborhood: "centro",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      packets: [
        expect.objectContaining({
          id: matchingPacket.id.toString(),
          status: "DELIVERED",
          delivererId: deliverer1.id.toString(),
        }),
      ],
      page: 1,
      perPage: DEFAULT_PER_PAGE,
    });
  });

  test("[GET /admin/packets] rejects invalid status or unexpected query params with 400", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const token = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });

    await request(app.getHttpServer())
      .get("/admin/packets")
      .query({ status: "INVALID_STATUS" })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .get("/admin/packets")
      .query({ latitude: -23.1857 })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
