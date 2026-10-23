import { faker } from "@faker-js/faker";
import { makeUser } from "test/factories/user/make-user";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DestinationCreateUseCase } from "./destination-create.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let sut: DestinationCreateUseCase; // Subject Under Test

describe("Create Destination", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    sut = new DestinationCreateUseCase(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
  });

  it("should be able to create a destination", async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      recipientId: user.id.toString(),
      title: faker.lorem.word(),
      addressStreet: faker.location.street(),
      addressNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
      addressComplement: faker.location.secondaryAddress(),
      addressZipCode: faker.location.zipCode(),
      addressNeighborhood: faker.location.county(),
      addressCity: faker.location.city(),
      addressState: faker.location.state(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    });

    expect(result.isRight()).toBe(true);
    expect(
      inMemoryDestinationsRepository.items[0].recipientId.toString(),
    ).toEqual(user.id.toString());
  });

  it("should not be able to create a destination with an invalid recipient", async () => {
    const result = await sut.execute({
      recipientId: "invalid-recipient-id",
      title: faker.lorem.word(),
      addressStreet: faker.location.street(),
      addressNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
      addressComplement: faker.location.secondaryAddress(),
      addressZipCode: faker.location.zipCode(),
      addressNeighborhood: faker.location.county(),
      addressCity: faker.location.city(),
      addressState: faker.location.state(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
