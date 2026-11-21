import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import { PacketListByDelivererUseCase } from "./packet-list-by-deliverer.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketListByDelivererUseCase;

describe("Packet List By Deliverer Use Case", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();

    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );

    sut = new PacketListByDelivererUseCase(inMemoryPacketsRepository);
  });

  it("should be able to list recent packets for a specific deliverer", async () => {
    const recipient1 = userMaker({ role: Role.create("RECIPIENT") });
    await inMemoryUsersRepository.create(recipient1);

    const deliverer1 = userMaker({ role: Role.create("DELIVERER") });
    await inMemoryUsersRepository.create(deliverer1);

    const destination1 = destinationMaker({ recipientId: recipient1.id });
    await inMemoryDestinationsRepository.create(destination1);

    const packet2 = packetMaker({
      delivererId: deliverer1.id,
      destinationId: destination1.id,
      createdAt: new Date(2026, 0, 18),
    });
    await inMemoryPacketsRepository.create(packet2);

    const packet1 = packetMaker({
      delivererId: deliverer1.id,
      destinationId: destination1.id,
      createdAt: new Date(2026, 0, 20),
    });
    await inMemoryPacketsRepository.create(packet1);

    const recipient2 = userMaker({ role: Role.create("RECIPIENT") });
    await inMemoryUsersRepository.create(recipient2);

    const deliverer2 = userMaker({ role: Role.create("DELIVERER") });
    await inMemoryUsersRepository.create(deliverer2);

    const destination2 = destinationMaker({
      recipientId: recipient2.id,
    });
    await inMemoryDestinationsRepository.create(destination2);

    const packet3 = packetMaker({
      delivererId: deliverer2.id,
      destinationId: destination2.id,
      createdAt: new Date(2026, 0, 19),
    });
    await inMemoryPacketsRepository.create(packet3);

    const result = await sut.execute({
      delivererId: deliverer1.id.toString(),
      page: 1,
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.packets).toHaveLength(2);
      expect(result.value.packets).toEqual([
        expect.objectContaining({ id: packet1.id }),
        expect.objectContaining({ id: packet2.id }),
      ]);
    }
  });

  it("should be able to fetch paginated packets by deliverer ", async () => {
    const recipient = userMaker({ role: Role.create("RECIPIENT") });
    await inMemoryUsersRepository.create(recipient);

    const deliverer = userMaker({ role: Role.create("DELIVERER") });
    await inMemoryUsersRepository.create(deliverer);

    const destination = destinationMaker({ recipientId: recipient.id });
    await inMemoryDestinationsRepository.create(destination);

    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        packetMaker({
          delivererId: deliverer.id,
          destinationId: destination.id,
        }),
      );
    }

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packets).toHaveLength(2);
    }
  });
});
