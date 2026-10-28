import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import { PacketGetUseCase } from "./packet-get.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketGetUseCase; // Subject Under Test

describe("Get Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketGetUseCase(inMemoryPacketsRepository);
  });

  it("should be able to get a packet", async () => {
    const recipient = userMaker({
      role: Role.create("RECIPIENT"),
    });

    await inMemoryUsersRepository.create(recipient);

    const destination = destinationMaker({
      recipientId: recipient.id,
    });

    await inMemoryDestinationsRepository.create(destination);

    const packet = packetMaker({
      destinationId: destination.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      packet: expect.objectContaining({
        recipient: recipient.name,
        status: "WITHDRAWN",
      }),
    });
  });

  it("should not be able to get a non-existing packet", async () => {
    const result = await sut.execute({
      packetId: "non-existing-packet-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
