import { makePacket } from "test/factories/make-packet";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DeletePacketUseCase } from "./packet-delete.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: DeletePacketUseCase; // Subject Under Test

describe("Delete Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new DeletePacketUseCase(inMemoryPacketsRepository);
  });

  it("should be able to delete a packet", async () => {
    const packet = makePacket();

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPacketsRepository.items).toHaveLength(0);
  });

  it("should not be able to delete a non-existent packet", async () => {
    const result = await sut.execute({
      packetId: "non-existent-packet-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
