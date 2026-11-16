import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { PacketListByRecipientUseCase } from "./packet-list-by-recipient.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketListByRecipientUseCase;

describe("Packet List By Recipient Use Case", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();

    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );

    sut = new PacketListByRecipientUseCase(inMemoryPacketsRepository);
  });

  it("should be able to list recent packets for a specific recipient", async () => {
    const recipient = userMaker();
    await inMemoryUsersRepository.create(recipient);

    const destination = destinationMaker({ recipientId: recipient.id });
    await inMemoryDestinationsRepository.create(destination);

    const packet1 = packetMaker({
      destinationId: destination.id,
      createdAt: new Date(2026, 0, 20),
    });
    const packet2 = packetMaker({
      destinationId: destination.id,
      createdAt: new Date(2026, 0, 18),
    });

    const otherRecipient = userMaker();
    await inMemoryUsersRepository.create(otherRecipient);

    const otherDestination = destinationMaker({
      recipientId: otherRecipient.id,
    });
    await inMemoryDestinationsRepository.create(otherDestination);

    const otherPacket = packetMaker({ destinationId: otherDestination.id });

    await inMemoryPacketsRepository.create(packet2);
    await inMemoryPacketsRepository.create(otherPacket);
    await inMemoryPacketsRepository.create(packet1);

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
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

  it("should be able to fetch paginated recipient packets", async () => {
    const recipient = userMaker();
    await inMemoryUsersRepository.create(recipient);

    const destination = destinationMaker({ recipientId: recipient.id });
    await inMemoryDestinationsRepository.create(destination);

    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        packetMaker({ destinationId: destination.id }),
      );
    }

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packets).toHaveLength(2);
    }
  });
});
