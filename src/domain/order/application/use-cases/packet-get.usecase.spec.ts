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
let sut: PacketGetUseCase;

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

  it("should be able to get a packet as its recipient", async () => {
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
      userId: recipient.id.toString(),
      userRole: recipient.role.value,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      packet: expect.objectContaining({
        recipient: recipient.name,
        status: "WITHDRAWN",
      }),
    });
  });

  it("should be able to get any packet as an ADMIN", async () => {
    const admin = userMaker({
      role: Role.create("ADMIN"),
    });
    await inMemoryUsersRepository.create(admin);

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
      status: "AWAITING_WITHDRAWAL",
    });
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      userId: admin.id.toString(),
      userRole: admin.role.value,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      packet: expect.objectContaining({
        packetId: packet.id,
        recipient: recipient.name,
      }),
    });
  });

  it("should be able to get a packet as its assigned deliverer", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    await inMemoryUsersRepository.create(deliverer);

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
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      userId: deliverer.id.toString(),
      userRole: deliverer.role.value,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      packet: expect.objectContaining({
        packetId: packet.id,
        delivererId: deliverer.id,
      }),
    });
  });

  it("should not be able to get a non-existing packet", async () => {
    const result = await sut.execute({
      packetId: "non-existing-packet-id",
      userId: "any-user-id",
      userRole: "ADMIN",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to get another recipient's packet", async () => {
    const recipient = userMaker({
      role: Role.create("RECIPIENT"),
    });
    const otherRecipient = userMaker({
      role: Role.create("RECIPIENT"),
    });
    await inMemoryUsersRepository.create(recipient);
    await inMemoryUsersRepository.create(otherRecipient);

    const destination = destinationMaker({
      recipientId: recipient.id,
    });
    await inMemoryDestinationsRepository.create(destination);

    const packet = packetMaker({
      destinationId: destination.id,
    });
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      userId: otherRecipient.id.toString(),
      userRole: otherRecipient.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to get a packet assigned to another deliverer", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    const otherDeliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    const recipient = userMaker({
      role: Role.create("RECIPIENT"),
    });
    await inMemoryUsersRepository.create(deliverer);
    await inMemoryUsersRepository.create(otherDeliverer);
    await inMemoryUsersRepository.create(recipient);

    const destination = destinationMaker({
      recipientId: recipient.id,
    });
    await inMemoryDestinationsRepository.create(destination);

    const packet = packetMaker({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      userId: otherDeliverer.id.toString(),
      userRole: otherDeliverer.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to get an unassigned packet as a deliverer", async () => {
    const deliverer = userMaker({
      role: Role.create("DELIVERER"),
    });
    const recipient = userMaker({
      role: Role.create("RECIPIENT"),
    });
    await inMemoryUsersRepository.create(deliverer);
    await inMemoryUsersRepository.create(recipient);

    const destination = destinationMaker({
      recipientId: recipient.id,
    });
    await inMemoryDestinationsRepository.create(destination);

    const packet = packetMaker({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      userId: deliverer.id.toString(),
      userRole: deliverer.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
