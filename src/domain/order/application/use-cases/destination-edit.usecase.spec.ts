import { faker } from "@faker-js/faker";
import { makeDestination } from "test/factories/destination/make-destination";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DestinationEditUseCase } from "./destination-edit.usecase";

let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let sut: DestinationEditUseCase; // Subject Under Test

describe("Edit Destination", () => {
  beforeEach(() => {
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    sut = new DestinationEditUseCase(inMemoryDestinationsRepository);
  });

  it("should be able to edit a destination", async () => {
    const destination = makeDestination();

    await inMemoryDestinationsRepository.create(destination);

    const result = await sut.execute({
      destinationId: destination.id.toString(),
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
    expect(result.value).toMatchObject({
      destination: expect.objectContaining({
        updatedAt: expect.any(Date),
      }),
    });
    expect(inMemoryDestinationsRepository.items[0].updatedAt).toEqual(
      expect.any(Date),
    );
  });

  it("should not be able to edit a non-existing destination", async () => {
    const result = await sut.execute({
      destinationId: "non-existing-destination-id",
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
