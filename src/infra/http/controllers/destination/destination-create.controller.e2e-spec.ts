import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UserFactory } from "test/factories/user/user-factory";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("POST /destinations (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test("[POST] /destinations - creates a destination when authenticated as an ADMIN", async () => {
    const user = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const response = await request(app.getHttpServer())
      .post("/destinations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        recipientId: recipient.id.toString(),
        title: "Home",
        addressStreet: "Test Street",
        addressNumber: "123",
        addressComplement: "Apt 1",
        addressZipCode: "12345-678",
        addressNeighborhood: "Test Neighborhood",
        addressCity: "Test City",
        addressState: "TS",
        latitude: -23.55052,
        longitude: -46.633308,
      });

    expect(response.statusCode).toBe(201);

    const destinationOnDatabase = await prisma.destination.findFirst({
      where: {
        recipientId: recipient.id.toString(),
      },
    });

    expect(destinationOnDatabase).toBeTruthy();
    expect(destinationOnDatabase?.addressStreet).toBe("Test Street");
  });

  test("[POST] /destinations - returns 403 when the authenticated user is not an ADMIN", async () => {
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

    const response = await request(app.getHttpServer())
      .post("/destinations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        recipientId: recipient.id.toString(),
        title: "Home",
        addressStreet: "Blocked Street",
        addressNumber: "456",
        addressZipCode: "98765-432",
        addressNeighborhood: "Downtown",
        addressCity: "Blocked City",
        addressState: "BL",
        latitude: 0,
        longitude: 0,
      });

    expect(response.statusCode).toBe(403);
  });

  test("[POST] /destinations - returns 401 when no access token is provided", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    const response = await request(app.getHttpServer())
      .post("/destinations")
      .send({
        recipientId: recipient.id.toString(),
        title: "Home",
        addressStreet: "No Token Street",
        addressNumber: "789",
        addressZipCode: "11111-222",
        addressNeighborhood: "Downtown",
        addressCity: "No Token City",
        addressState: "NT",
        latitude: 0,
        longitude: 0,
      });

    expect(response.statusCode).toBe(401);
  });

  test("[POST] /destinations - returns 400 when invalid input is provided", async () => {
    const user = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });

    const accessToken = jwt.sign({
      sub: user.id.toString(),
      role: user.role.value,
    });

    const response = await request(app.getHttpServer())
      .post("/destinations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        recipientId: "invalid-id",
        title: 123,
        addressStreet: "",
        addressCity: "",
        latitude: "invalid-string",
      });

    expect(response.statusCode).toBe(400);
  });
});
