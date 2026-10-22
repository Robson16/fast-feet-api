import { makeDestination } from "test/factories/make-destination";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DestinationGetUseCase } from "./destination-get.usecase";

let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let sut: DestinationGetUseCase; // Subject Under Test

describe("Get Destination", () => {
  beforeEach(() => {
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    sut = new DestinationGetUseCase(inMemoryDestinationsRepository);
  });

  it("should be able to get a destination", async () => {
    const destination = makeDestination({
      title: "My House",
    });

    await inMemoryDestinationsRepository.create(destination);

    const result = await sut.execute({
      destinationId: destination.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      destination: expect.objectContaining({
        title: "My House",
      }),
    });
  });

  it("should not be able to get a non-existing destination", async () => {
    const result = await sut.execute({
      destinationId: "non-existing-destination-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
