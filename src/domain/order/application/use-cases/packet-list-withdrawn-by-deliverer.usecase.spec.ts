import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";

import { PacketListWithdrawnByDelivererUseCase } from "./packet-list-withdrawn-by-deliverer.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketListWithdrawnByDelivererUseCase; // Subject Under Test

describe("Fetch Packets Withdrawn by Deliverer", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketListWithdrawnByDelivererUseCase(inMemoryPacketsRepository);
  });

  it("should be able to fetch packets withdrawn by deliverer", async () => {
    const delivererId = new UniqueEntityID();

    const packet1 = packetMaker({
      delivererId,
      createdAt: new Date(2026, 0, 20),
      status: "WITHDRAWN",
    });
    const packet2 = packetMaker({
      delivererId,
      createdAt: new Date(2026, 0, 18),
      status: "WITHDRAWN",
    });
    const packet3 = packetMaker({
      delivererId,
      createdAt: new Date(2026, 0, 15),
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet3);
    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet2);

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
    expect(result.value?.packets).toEqual([
      expect.objectContaining({ id: packet1.id }),
      expect.objectContaining({ id: packet2.id }),
      expect.objectContaining({ id: packet3.id }),
    ]);
  });

  it("should be able to fetch packets withdrawn by deliverer and filtered by neighborhood", async () => {
    const delivererId = new UniqueEntityID();

    const destination1 = destinationMaker();
    const destination2 = destinationMaker();

    await inMemoryDestinationsRepository.create(destination1);
    await inMemoryDestinationsRepository.create(destination2);

    const packet1 = packetMaker({
      delivererId,
      destinationId: destination1.id,
      createdAt: new Date(2026, 0, 20),
      status: "WITHDRAWN",
    });
    const packet2 = packetMaker({
      delivererId,
      destinationId: destination1.id,
      createdAt: new Date(2026, 0, 18),
      status: "WITHDRAWN",
    });
    const packet3 = packetMaker({
      delivererId,
      destinationId: destination2.id,
      createdAt: new Date(2026, 0, 20),
      status: "WITHDRAWN",
    });
    const packet4 = packetMaker({
      delivererId,
      destinationId: destination2.id,
      createdAt: new Date(2026, 0, 18),
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet2);
    await inMemoryPacketsRepository.create(packet4);
    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet3);

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 1,
      neighborhood: destination1.addressNeighborhood,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(2);
    expect(result.value?.packets).toEqual([
      expect.objectContaining({ id: packet1.id }),
      expect.objectContaining({ id: packet2.id }),
    ]);
  });

  it("should be able to fetch paginated packets withdrawn by deliverer", async () => {
    const delivererId = new UniqueEntityID();

    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        packetMaker({
          delivererId,
          status: "WITHDRAWN",
        }),
      );
    }

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(2);
  });
});
