import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { UserFactory } from "test/factories/user/user-factory";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

describe("DELETE /destinations/:id (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let destinationFactory: DestinationFactory;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, DestinationFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactory);
    destinationFactory = moduleRef.get(DestinationFactory);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("[DELETE] /destinations/:id - deletes a destination when authenticated as an ADMIN", async () => {
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
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .delete(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(204);

    const destinationOnDatabase = await prisma.destination.findUnique({
      where: { id: target.id.toString() },
    });

    expect(destinationOnDatabase).toBeNull();
  });

  test("[DELETE] /destinations/:id - returns 404 when destination is not found", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const randomIdNotExistent = new UniqueEntityID();

    const response = await request(app.getHttpServer())
      .delete(`/destinations/${randomIdNotExistent.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test("[DELETE] /destinations/:id - returns 403 when the authenticated user is not an ADMIN", async () => {
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
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer())
      .delete(`/destinations/${target.id.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(403);

    const destinationOnDatabase = await prisma.destination.findUnique({
      where: { id: target.id.toString() },
    });

    expect(destinationOnDatabase).not.toBeNull();
  });

  test("[DELETE] /destinations/:id - returns 400 when the id is not a UUID", async () => {
    const admin = await userFactory.makePrismaUser({
      role: Role.create("ADMIN"),
    });
    const accessToken = jwt.sign({
      sub: admin.id.toString(),
      role: admin.role.value,
    });

    const response = await request(app.getHttpServer())
      .delete("/destinations/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
  });

  test("[DELETE] /destinations/:id - returns 401 when no access token is provided", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const target = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const response = await request(app.getHttpServer()).delete(
      `/destinations/${target.id.toString()}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
