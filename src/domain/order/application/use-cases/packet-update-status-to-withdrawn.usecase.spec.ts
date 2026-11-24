import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import { UnavailablePacketError } from "./errors/unavailable-packet-error";
import { PacketUpdateStatusToWithdrawnUseCase } from "./packet-update-status-to-withdrawn.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketUpdateStatusToWithdrawnUseCase; // Subject Under Test

describe("Withdrawal Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketUpdateStatusToWithdrawnUseCase(
      inMemoryUsersRepository,
      inMemoryPacketsRepository,
    );
  });

  it("should be able to withdrawal a packet", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    const packet = packetMaker();

    await inMemoryUsersRepository.create(deliverer);
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryPacketsRepository.items[0]).toMatchObject({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
  });

  it("should not be able to withdrawal with a non-existing deliverer", async () => {
    const packet = packetMaker();

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: "non-existing-deliverer-id",
      packetId: packet.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to withdrawal a packet if user is not a deliverer", async () => {
    const recipient = userMaker({
      role: Role.create("RECIPIENT"),
    });
    const packet = packetMaker();

    await inMemoryUsersRepository.create(recipient);
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: recipient.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to withdrawal a non-existing packet", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });

    await inMemoryUsersRepository.create(deliverer);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: "non-existing-packet-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to withdrawal an unavailable packet", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    const packet = packetMaker({
      status: "DELIVERED",
    });

    await inMemoryUsersRepository.create(deliverer);
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UnavailablePacketError);
  });
});
