import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { destinationMaker } from "test/factories/destination/destination-maker";
import { UserFactory } from "test/factories/user/user-factory";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { DatabaseModule } from "@/infra/database/database.module";

describe("PrismaDestinationsRepository (E2E)", () => {
  let app: INestApplication;
  let destinationsRepository: DestinationsRepository;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    destinationsRepository = moduleRef.get(DestinationsRepository);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("creates, finds, updates, and deletes a destination", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = destinationMaker({
      recipientId: recipient.id,
    });

    await destinationsRepository.create(destination);

    const createdDestination = await destinationsRepository.findById(
      destination.id.toString(),
    );
    expect(createdDestination?.id.toString()).toBe(destination.id.toString());

    destination.title = "Updated destination";
    await destinationsRepository.save(destination);

    const updatedDestination = await destinationsRepository.findById(
      destination.id.toString(),
    );
    expect(updatedDestination?.title).toBe("Updated destination");

    await destinationsRepository.delete(destination);
    const destinationOnDatabase = await destinationsRepository.findById(
      destination.id.toString(),
    );

    expect(destinationOnDatabase).toBeNull();
  });

  test("returns null when the destination does not exist", async () => {
    const destination = await destinationsRepository.findById(
      new UniqueEntityID().toString(),
    );

    expect(destination).toBeNull();
  });

  test("rejects updates and deletes for a destination that does not exist", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = destinationMaker({
      recipientId: recipient.id,
    });

    await expect(destinationsRepository.save(destination)).rejects.toThrow();
    await expect(destinationsRepository.delete(destination)).rejects.toThrow();
  });
});
