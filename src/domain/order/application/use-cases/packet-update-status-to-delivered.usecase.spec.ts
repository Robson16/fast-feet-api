import { makePacket } from "test/factories/make-packet";
import { makeUser } from "test/factories/make-user";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { UpdatePacketStatusToDeliveredUseCase } from "./packet-update-status-to-delivered.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: UpdatePacketStatusToDeliveredUseCase; // Subject Under Test

describe("Deliver Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new UpdatePacketStatusToDeliveredUseCase(inMemoryPacketsRepository);
  });

  it("should be able to deliver a packet", async () => {
    const deliverer = makeUser();

    const packet = makePacket({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPacketsRepository.items[0]).toMatchObject({
      delivererId: deliverer.id,
      status: "DELIVERED",
    });
  });

  it("should not be able to deliver a non existing packet", async () => {
    const deliverer = makeUser();

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: "non-existing-packet-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to deliver a packet not withdrawn by a deliverer", async () => {
    const deliverer = makeUser();

    const packet = makePacket({
      delivererId: undefined,
      status: "AWAITING_WITHDRAWAL",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to deliver a packet already delivered", async () => {
    const deliverer = makeUser();

    const packet = makePacket({
      delivererId: deliverer.id,
      status: "DELIVERED",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
