import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";

import { PacketListAdminUseCase } from "./packet-list-admin.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketListAdminUseCase;

describe("List Packets (Admin)", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketListAdminUseCase(inMemoryPacketsRepository);
  });

  it("should be able to list all packets without filters ordered by createdAt desc", async () => {
    const packet1 = packetMaker({
      status: "AWAITING_WITHDRAWAL",
      createdAt: new Date(2026, 0, 14),
    });
    const packet2 = packetMaker({
      status: "WITHDRAWN",
      createdAt: new Date(2026, 0, 18),
    });
    const packet3 = packetMaker({
      status: "DELIVERED",
      createdAt: new Date(2026, 0, 16),
    });

    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet2);
    await inMemoryPacketsRepository.create(packet3);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
    expect(result.value?.packets).toEqual([
      expect.objectContaining({ id: packet2.id }),
      expect.objectContaining({ id: packet3.id }),
      expect.objectContaining({ id: packet1.id }),
    ]);
  });

  it("should be able to filter packets by status", async () => {
    const returnedPacket = packetMaker({ status: "RETURNED" });
    const deliveredPacket = packetMaker({ status: "DELIVERED" });

    await inMemoryPacketsRepository.create(returnedPacket);
    await inMemoryPacketsRepository.create(deliveredPacket);

    const result = await sut.execute({
      page: 1,
      status: "RETURNED",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(1);
    expect(result.value?.packets[0].id).toEqual(returnedPacket.id);
  });

  it("should be able to filter packets by delivererId", async () => {
    const deliverer1Id = new UniqueEntityID();
    const deliverer2Id = new UniqueEntityID();

    const packet1 = packetMaker({
      delivererId: deliverer1Id,
      status: "WITHDRAWN",
    });
    const packet2 = packetMaker({
      delivererId: deliverer2Id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet2);

    const result = await sut.execute({
      page: 1,
      delivererId: deliverer1Id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(1);
    expect(result.value?.packets[0].id).toEqual(packet1.id);
  });

  it("should be able to combine status, delivererId, and address filters case-insensitively", async () => {
    const deliverer1Id = new UniqueEntityID();
    const deliverer2Id = new UniqueEntityID();

    const destinationSp = destinationMaker({
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Centro",
    });
    const destinationRj = destinationMaker({
      addressState: "RJ",
      addressCity: "Rio de Janeiro",
      addressNeighborhood: "Copacabana",
    });

    await inMemoryDestinationsRepository.create(destinationSp);
    await inMemoryDestinationsRepository.create(destinationRj);

    const matchingPacket = packetMaker({
      delivererId: deliverer1Id,
      destinationId: destinationSp.id,
      status: "DELIVERED",
    });
    const wrongStatusPacket = packetMaker({
      delivererId: deliverer1Id,
      destinationId: destinationSp.id,
      status: "WITHDRAWN",
    });
    const wrongDelivererPacket = packetMaker({
      delivererId: deliverer2Id,
      destinationId: destinationSp.id,
      status: "DELIVERED",
    });
    const wrongAddressPacket = packetMaker({
      delivererId: deliverer1Id,
      destinationId: destinationRj.id,
      status: "DELIVERED",
    });

    await inMemoryPacketsRepository.create(matchingPacket);
    await inMemoryPacketsRepository.create(wrongStatusPacket);
    await inMemoryPacketsRepository.create(wrongDelivererPacket);
    await inMemoryPacketsRepository.create(wrongAddressPacket);

    const result = await sut.execute({
      page: 1,
      status: "DELIVERED",
      delivererId: deliverer1Id.toString(),
      state: "sp",
      city: "jundiaí",
      neighborhood: "centro",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(1);
    expect(result.value?.packets[0].id).toEqual(matchingPacket.id);
  });

  it("should be able to paginate packets and return empty list past the last page", async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(packetMaker());
    }

    const page2 = await sut.execute({ page: 2 });
    const page3 = await sut.execute({ page: 3 });

    expect(page2.isRight()).toBe(true);
    expect(page2.value?.packets).toHaveLength(2);

    expect(page3.isRight()).toBe(true);
    expect(page3.value?.packets).toHaveLength(0);
  });
});
