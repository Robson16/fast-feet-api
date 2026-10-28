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

  it("should be able to list packets for a specific recipient", async () => {
    const recipient = userMaker();
    inMemoryUsersRepository.items.push(recipient);

    const destination = destinationMaker({ recipientId: recipient.id });
    inMemoryDestinationsRepository.items.push(destination);

    const packet1 = packetMaker({ destinationId: destination.id });
    const packet2 = packetMaker({ destinationId: destination.id });
    inMemoryPacketsRepository.items.push(packet1, packet2);

    const otherRecipient = userMaker();
    inMemoryUsersRepository.items.push(otherRecipient);

    const otherDestination = destinationMaker({
      recipientId: otherRecipient.id,
    });
    inMemoryDestinationsRepository.items.push(otherDestination);

    const otherPacket = packetMaker({ destinationId: otherDestination.id });
    inMemoryPacketsRepository.items.push(otherPacket);

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
    inMemoryUsersRepository.items.push(recipient);

    const destination = destinationMaker({ recipientId: recipient.id });
    inMemoryDestinationsRepository.items.push(destination);

    for (let i = 1; i <= 22; i++) {
      inMemoryPacketsRepository.items.push(
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
