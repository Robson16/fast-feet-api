import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { PacketFetchReturnedUseCase } from "./packet-fetch-returned.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketFetchReturnedUseCase;

describe("Fetch Returned Packets", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketFetchReturnedUseCase(inMemoryPacketsRepository);
  });

  it("should be able to fetch recent returned packets ordered by createdAt desc", async () => {
    const withdrawnPacket = packetMaker({
      createdAt: new Date(2026, 0, 20),
      status: "WITHDRAWN",
    });
    const deliveredPacket = packetMaker({
      createdAt: new Date(2026, 0, 19),
      status: "DELIVERED",
    });
    const returned1 = packetMaker({
      createdAt: new Date(2026, 0, 18),
      status: "RETURNED",
    });
    const returned2 = packetMaker({
      createdAt: new Date(2026, 0, 16),
      status: "RETURNED",
    });
    const returned3 = packetMaker({
      createdAt: new Date(2026, 0, 14),
      status: "RETURNED",
    });

    await inMemoryPacketsRepository.create(returned2);
    await inMemoryPacketsRepository.create(withdrawnPacket);
    await inMemoryPacketsRepository.create(returned3);
    await inMemoryPacketsRepository.create(deliveredPacket);
    await inMemoryPacketsRepository.create(returned1);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
    expect(result.value?.packets).toEqual([
      expect.objectContaining({ id: returned1.id }),
      expect.objectContaining({ id: returned2.id }),
      expect.objectContaining({ id: returned3.id }),
    ]);
  });

  it("should be able to filter returned packets by state, city, and neighborhood case-insensitively", async () => {
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
      destinationId: destinationSp.id,
      status: "RETURNED",
    });
    const nonMatchingPacket = packetMaker({
      destinationId: destinationRj.id,
      status: "RETURNED",
    });

    await inMemoryPacketsRepository.create(matchingPacket);
    await inMemoryPacketsRepository.create(nonMatchingPacket);

    const result = await sut.execute({
      page: 1,
      state: "sp",
      city: "jundiaí",
      neighborhood: "centro",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(1);
    expect(result.value?.packets[0].id).toEqual(matchingPacket.id);
  });

  it("should be able to paginate returned packets and return empty list past the last page", async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        packetMaker({ status: "RETURNED" }),
      );
    }

    const page2 = await sut.execute({ page: 2 });
    const page3 = await sut.execute({ page: 3 });

    expect(page2.isRight()).toBe(true);
    expect(page2.value?.packets).toHaveLength(2);

    expect(page3.isRight()).toBe(true);
    expect(page3.value?.packets).toHaveLength(0);
  });
});
