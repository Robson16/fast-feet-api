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

describe("List Returned Packets (E2E)", () => {
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

  test("[GET /packets/returned] allows ADMIN and forbids DELIVERER and RECIPIENT", async () => {
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
      .get("/packets/returned")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get("/packets/returned")
      .set("Authorization", `Bearer ${delivererToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get("/packets/returned")
      .set("Authorization", `Bearer ${recipientToken}`)
      .expect(403);
  });

  test("[GET /packets/returned] lists only RETURNED packets filtered by address", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const targetDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Anhangabaú",
    });
    const otherDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Centro",
    });

    const matchingPacket = packetMaker({
      destinationId: targetDestination.id,
      status: "RETURNED",
    });
    const otherNeighborhoodPacket = packetMaker({
      destinationId: otherDestination.id,
      status: "RETURNED",
    });
    const withdrawnPacket = packetMaker({
      destinationId: targetDestination.id,
      status: "WITHDRAWN",
    });

    await packetsRepository.create(matchingPacket);
    await packetsRepository.create(otherNeighborhoodPacket);
    await packetsRepository.create(withdrawnPacket);

    const token = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });

    const response = await request(app.getHttpServer())
      .get("/packets/returned")
      .query({ state: "sp", city: "jundiaí", neighborhood: "anhangabaú" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      packets: [
        expect.objectContaining({
          id: matchingPacket.id.toString(),
          status: "RETURNED",
        }),
      ],
      page: 1,
      perPage: DEFAULT_PER_PAGE,
    });
  });

  test("[GET /packets/returned] rejects unknown query parameters with 400", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const token = jwt.sign({ sub: admin.id.toString(), role: "ADMIN" });

    await request(app.getHttpServer())
      .get("/packets/returned")
      .query({ status: "RETURNED" })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
