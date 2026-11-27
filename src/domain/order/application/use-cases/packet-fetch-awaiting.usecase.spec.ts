import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { PacketFetchAwaitingUseCase } from "./packet-fetch-awaiting.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketFetchAwaitingUseCase; // Subject Under Test

describe("Fetch Packets Awaiting Withdrawal", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketFetchAwaitingUseCase(inMemoryPacketsRepository);
  });

  it("should be able to fetch recent packets awaiting withdrawal", async () => {
    const packet1 = packetMaker({
      createdAt: new Date(2026, 0, 20),
      status: "WITHDRAWN",
    });
    const packet2 = packetMaker({
      createdAt: new Date(2026, 0, 18),
      status: "AWAITING_WITHDRAWAL",
    });
    const packet3 = packetMaker({
      createdAt: new Date(2026, 0, 16),
      status: "AWAITING_WITHDRAWAL",
    });
    const packet4 = packetMaker({
      createdAt: new Date(2026, 0, 14),
      status: "AWAITING_WITHDRAWAL",
    });

    await inMemoryPacketsRepository.create(packet2);
    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet4);
    await inMemoryPacketsRepository.create(packet3);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
    expect(result.value?.packets).toEqual([
      expect.objectContaining({ id: packet2.id }),
      expect.objectContaining({ id: packet3.id }),
      expect.objectContaining({ id: packet4.id }),
    ]);
  });

  it("should be able to filter awaiting packets by state, city, and neighborhood", async () => {
    const destination1 = destinationMaker({
      addressState: "SP",
      addressCity: "Jundiaí",
      addressNeighborhood: "Centro",
    });
    const destination2 = destinationMaker({
      addressState: "RJ",
      addressCity: "Rio de Janeiro",
      addressNeighborhood: "Copacabana",
    });

    await inMemoryDestinationsRepository.create(destination1);
    await inMemoryDestinationsRepository.create(destination2);

    const packet1 = packetMaker({
      destinationId: destination1.id,
      status: "AWAITING_WITHDRAWAL",
    });
    const packet2 = packetMaker({
      destinationId: destination2.id,
      status: "AWAITING_WITHDRAWAL",
    });

    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet2);

    const result = await sut.execute({
      page: 1,
      state: "sp",
      city: "jundiaí",
      neighborhood: "centro",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(1);
    expect(result.value?.packets[0].id).toEqual(packet1.id);
  });

  it("should be able to fetch paginated packets", async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        packetMaker({ status: "AWAITING_WITHDRAWAL" }),
      );
    }

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(2);
  });
});
