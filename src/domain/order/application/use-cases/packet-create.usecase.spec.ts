import { makeDestination } from "test/factories/make-destination";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { PacketCreateUseCase } from "./packet-create.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketCreateUseCase; // Subject Under Test

describe("Create Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketCreateUseCase(
      inMemoryDestinationsRepository,
      inMemoryPacketsRepository,
    );
  });

  it("should be able to create a packet", async () => {
    const destination = makeDestination();

    await inMemoryDestinationsRepository.create(destination);

    const result = await sut.execute({
      destinationId: destination.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPacketsRepository.items[0]).toMatchObject({
      status: "AWAITING_WITHDRAWAL",
    });
  });

  it("should not be able to create a packet with an invalid destination", async () => {
    const result = await sut.execute({
      destinationId: "invalid-destination-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
