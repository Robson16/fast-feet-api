import { destinationMaker } from "test/factories/destination/destination-maker";
import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";
import { FakeStorageProvider } from "test/storage/fake-storage-provider";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import {
  DELIVERY_PHOTO_URL_TTL_SECONDS,
  PacketGetDeliveryPhotoUseCase,
} from "./packet-get-delivery-photo.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let fakeStorageProvider: FakeStorageProvider;
let sut: PacketGetDeliveryPhotoUseCase;

describe("Get Packet Delivery Photo", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    fakeStorageProvider = new FakeStorageProvider();
    sut = new PacketGetDeliveryPhotoUseCase(
      inMemoryPacketsRepository,
      fakeStorageProvider,
    );
  });

  async function createDeliveredPacketWithPhoto() {
    const recipient = userMaker({ role: Role.create("RECIPIENT") });
    const deliverer = userMaker({ role: Role.create("DELIVERER") });
    const destination = destinationMaker({ recipientId: recipient.id });
    const packet = packetMaker({
      destinationId: destination.id,
      delivererId: deliverer.id,
      status: "DELIVERED",
      deliveryPhotoKey: "photo-uuid-proof.jpg",
      deliveryPhotoMimeType: "image/jpeg",
      deliveryPhotoSize: 1024,
      deliveryPhotoUploadedAt: new Date(),
    });

    await inMemoryUsersRepository.create(recipient);
    await inMemoryUsersRepository.create(deliverer);
    await inMemoryDestinationsRepository.create(destination);
    await inMemoryPacketsRepository.create(packet);

    return { recipient, deliverer, destination, packet };
  }

  it("should allow ADMIN to get a signed URL for any packet photo", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const admin = userMaker({ role: Role.create("ADMIN") });

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: admin.id.toString(),
      requesterRole: admin.role.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.url).toContain("photo-uuid-proof.jpg");
      expect(result.value.expiresIn).toBe(DELIVERY_PHOTO_URL_TTL_SECONDS);
    }
  });

  it("should allow the owner RECIPIENT to get the signed URL", async () => {
    const { recipient, packet } = await createDeliveredPacketWithPhoto();

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: recipient.id.toString(),
      requesterRole: recipient.role.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.url).toContain("photo-uuid-proof.jpg");
    }
  });

  it("should allow the assigned DELIVERER to get the signed URL", async () => {
    const { deliverer, packet } = await createDeliveredPacketWithPhoto();

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: deliverer.id.toString(),
      requesterRole: deliverer.role.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.url).toContain("photo-uuid-proof.jpg");
    }
  });

  it("should not allow another RECIPIENT to access the delivery photo", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const otherRecipient = userMaker({ role: Role.create("RECIPIENT") });

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: otherRecipient.id.toString(),
      requesterRole: otherRecipient.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not allow another DELIVERER to access the delivery photo", async () => {
    const { packet } = await createDeliveredPacketWithPhoto();
    const otherDeliverer = userMaker({ role: Role.create("DELIVERER") });

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: otherDeliverer.id.toString(),
      requesterRole: otherDeliverer.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should return ResourceNotFoundError if packet has no delivery photo", async () => {
    const recipient = userMaker({ role: Role.create("RECIPIENT") });
    const destination = destinationMaker({ recipientId: recipient.id });
    const packet = packetMaker({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    await inMemoryUsersRepository.create(recipient);
    await inMemoryDestinationsRepository.create(destination);
    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      packetId: packet.id.toString(),
      requesterId: recipient.id.toString(),
      requesterRole: recipient.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should return ResourceNotFoundError if packet does not exist", async () => {
    const admin = userMaker({ role: Role.create("ADMIN") });

    const result = await sut.execute({
      packetId: "non-existing-packet-id",
      requesterId: admin.id.toString(),
      requesterRole: admin.role.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
