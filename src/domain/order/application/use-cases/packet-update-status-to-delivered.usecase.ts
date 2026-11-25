import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { StorageProvider } from "@/domain/order/application/storage/storage-provider";
import { validateDeliveryPhoto } from "@/domain/order/application/storage/validate-delivery-photo";
import { InvalidDeliveryPhotoError } from "@/domain/order/application/use-cases/errors/invalid-delivery-photo-error";
import { UnavailablePacketError } from "@/domain/order/application/use-cases/errors/unavailable-packet-error";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketUpdateStatusToDeliveredUseCaseRequest {
  delivererId: string;
  packetId: string;
  photo: {
    fileName: string;
    body: Buffer;
  };
}

type PacketUpdateStatusToDeliveredUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | UnavailablePacketError
  | InvalidDeliveryPhotoError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class PacketUpdateStatusToDeliveredUseCase {
  constructor(
    private packetsRepository: PacketsRepository,
    private storageProvider: StorageProvider,
  ) {}

  async execute({
    delivererId,
    packetId,
    photo,
  }: PacketUpdateStatusToDeliveredUseCaseRequest): Promise<PacketUpdateStatusToDeliveredUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (packet.status === "DELIVERED") {
      return left(new UnavailablePacketError("Packet already delivered."));
    }

    if (packet.status !== "WITHDRAWN" || !packet.delivererId) {
      return left(
        new UnavailablePacketError("Packet is not withdrawn for delivery."),
      );
    }

    if (packet.delivererId.toString() !== delivererId) {
      return left(
        new NotAllowedError(
          "Only the deliverer who withdrew this packet can mark it as delivered.",
        ),
      );
    }

    const validation = validateDeliveryPhoto(photo.body);

    if (!validation.valid) {
      return left(new InvalidDeliveryPhotoError(validation.reason));
    }

    const { key } = await this.storageProvider.upload({
      fileName: photo.fileName,
      fileType: validation.mimeType,
      body: photo.body,
    });

    packet.status = "DELIVERED";
    packet.deliveryPhotoKey = key;
    packet.deliveryPhotoMimeType = validation.mimeType;
    packet.deliveryPhotoSize = validation.size;
    packet.deliveryPhotoUploadedAt = new Date();

    try {
      await this.packetsRepository.save(packet);
    } catch (error) {
      await this.storageProvider.delete(key);
      throw error;
    }

    return right({
      packet,
    });
  }
}
