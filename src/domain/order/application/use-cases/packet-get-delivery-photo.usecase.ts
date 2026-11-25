import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { StorageProvider } from "@/domain/order/application/storage/storage-provider";
import { RoleType } from "@/domain/user/enterprise/entities/value-objects/role";

export const DELIVERY_PHOTO_URL_TTL_SECONDS = 300;

interface PacketGetDeliveryPhotoUseCaseRequest {
  packetId: string;
  requesterId: string;
  requesterRole: RoleType;
}

type PacketGetDeliveryPhotoUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    url: string;
    expiresIn: number;
  }
>;

@Injectable()
export class PacketGetDeliveryPhotoUseCase {
  constructor(
    private packetsRepository: PacketsRepository,
    private storageProvider: StorageProvider,
  ) {}

  async execute({
    packetId,
    requesterId,
    requesterRole,
  }: PacketGetDeliveryPhotoUseCaseRequest): Promise<PacketGetDeliveryPhotoUseCaseResponse> {
    const packet = await this.packetsRepository.findDetailsById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    const isAdmin = requesterRole === "ADMIN";
    const isOwnerRecipient =
      requesterRole === "RECIPIENT" &&
      packet.recipientId.toString() === requesterId;
    const isAssignedDeliverer =
      requesterRole === "DELIVERER" &&
      packet.delivererId?.toString() === requesterId;

    if (!isAdmin && !isOwnerRecipient && !isAssignedDeliverer) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (!packet.deliveryPhotoKey) {
      return left(new ResourceNotFoundError("Delivery photo not found."));
    }

    const url = await this.storageProvider.getSignedUrl(
      packet.deliveryPhotoKey,
      DELIVERY_PHOTO_URL_TTL_SECONDS,
    );

    return right({
      url,
      expiresIn: DELIVERY_PHOTO_URL_TTL_SECONDS,
    });
  }
}
