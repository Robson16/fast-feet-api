import { makeDestination } from "test/factories/make-destination";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DeleteDestinationUseCase } from "./destination-delete.usecase";

let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let sut: DeleteDestinationUseCase; // Subject Under Test

describe("Delete Destination", () => {
  beforeEach(() => {
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    sut = new DeleteDestinationUseCase(inMemoryDestinationsRepository);
  });

  it("should be able to delete a destination", async () => {
    const destination = makeDestination();

    await inMemoryDestinationsRepository.create(destination);

    const result = await sut.execute({
      destinationId: destination.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryDestinationsRepository.items).toHaveLength(0);
  });

  it("should not be able to delete a non-existent destination", async () => {
    const result = await sut.execute({
      destinationId: "non-existent-destination-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
