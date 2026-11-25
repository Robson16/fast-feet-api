import { packetMaker } from "test/factories/packet/packet-maker";
import { userMaker } from "test/factories/user/user-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";
import { FakeStorageProvider } from "test/storage/fake-storage-provider";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvalidDeliveryPhotoError } from "@/domain/order/application/use-cases/errors/invalid-delivery-photo-error";
import { UnavailablePacketError } from "@/domain/order/application/use-cases/errors/unavailable-packet-error";

import { PacketUpdateStatusToDeliveredUseCase } from "./packet-update-status-to-delivered.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let fakeStorageProvider: FakeStorageProvider;
let sut: PacketUpdateStatusToDeliveredUseCase;

const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("Deliver Packet", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    fakeStorageProvider = new FakeStorageProvider();
    sut = new PacketUpdateStatusToDeliveredUseCase(
      inMemoryPacketsRepository,
      fakeStorageProvider,
    );
  });

  it("should be able to deliver a packet with a valid photo", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
      photo: {
        fileName: "proof.jpg",
        body: validJpegBuffer,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(fakeStorageProvider.items).toHaveLength(1);
    expect(inMemoryPacketsRepository.items[0]).toMatchObject({
      delivererId: deliverer.id,
      status: "DELIVERED",
      deliveryPhotoKey: fakeStorageProvider.items[0].key,
      deliveryPhotoMimeType: "image/jpeg",
      deliveryPhotoSize: validJpegBuffer.length,
    });
    expect(
      inMemoryPacketsRepository.items[0].deliveryPhotoUploadedAt,
    ).toBeInstanceOf(Date);
  });

  it("should not be able to deliver a non existing packet", async () => {
    const deliverer = userMaker();

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: "non-existing-packet-id",
      photo: {
        fileName: "proof.jpg",
        body: validJpegBuffer,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  it("should not be able to deliver a packet not withdrawn by a deliverer", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: undefined,
      status: "AWAITING_WITHDRAWAL",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
      photo: {
        fileName: "proof.jpg",
        body: validJpegBuffer,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UnavailablePacketError);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  it("should not be able to deliver a packet already delivered", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: deliverer.id,
      status: "DELIVERED",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
      photo: {
        fileName: "proof.jpg",
        body: validJpegBuffer,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UnavailablePacketError);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  it("should not be able to deliver a packet withdrawn by another deliverer", async () => {
    const deliverer = userMaker();
    const otherDeliverer = userMaker();

    const packet = packetMaker({
      delivererId: otherDeliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
      photo: {
        fileName: "proof.jpg",
        body: validJpegBuffer,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  it("should not be able to deliver a packet with an invalid photo", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      packetId: packet.id.toString(),
      photo: {
        fileName: "fake.jpg",
        body: Buffer.from("not a real image", "utf-8"),
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidDeliveryPhotoError);
    expect(fakeStorageProvider.items).toHaveLength(0);
  });

  it("should not mark packet as delivered when storage upload fails", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);
    fakeStorageProvider.shouldFailUpload = true;

    await expect(
      sut.execute({
        delivererId: deliverer.id.toString(),
        packetId: packet.id.toString(),
        photo: {
          fileName: "proof.jpg",
          body: validJpegBuffer,
        },
      }),
    ).rejects.toThrow("Storage upload failed");

    expect(inMemoryPacketsRepository.items[0].status).toBe("WITHDRAWN");
    expect(inMemoryPacketsRepository.items[0].deliveryPhotoKey).toBeUndefined();
  });

  it("should delete uploaded photo from storage if saving to database fails", async () => {
    const deliverer = userMaker();

    const packet = packetMaker({
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet);

    vi.spyOn(inMemoryPacketsRepository, "save").mockRejectedValueOnce(
      new Error("Database write failed"),
    );

    await expect(
      sut.execute({
        delivererId: deliverer.id.toString(),
        packetId: packet.id.toString(),
        photo: {
          fileName: "proof.jpg",
          body: validJpegBuffer,
        },
      }),
    ).rejects.toThrow("Database write failed");

    expect(fakeStorageProvider.items).toHaveLength(0);
    expect(fakeStorageProvider.deletedKeys).toHaveLength(1);
  });
});
