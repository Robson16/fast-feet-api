import { Packet as PrismaPacket, Prisma } from "@prisma/client";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Packet,
  PacketStatus,
} from "@/domain/order/enterprise/entities/packet";

export class PrismaPacketMapper {
  static toDomain(raw: PrismaPacket): Packet {
    return Packet.create(
      {
        destinationId: new UniqueEntityID(raw.destinationId),
        delivererId: raw.delivererId
          ? new UniqueEntityID(raw.delivererId)
          : undefined,
        status: raw.status as PacketStatus,
        deliveryPhotoKey: raw.deliveryPhotoKey
          ? raw.deliveryPhotoKey
          : undefined,
        deliveryPhotoMimeType: raw.deliveryPhotoMimeType
          ? raw.deliveryPhotoMimeType
          : undefined,
        deliveryPhotoSize: raw.deliveryPhotoSize
          ? raw.deliveryPhotoSize
          : undefined,
        deliveryPhotoUploadedAt: raw.deliveryPhotoUploadedAt
          ? raw.deliveryPhotoUploadedAt
          : undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(packet: Packet): Prisma.PacketUncheckedCreateInput {
    return {
      id: packet.id.toString(),
      destinationId: packet.destinationId.toString(),
      delivererId: packet.delivererId ? packet.delivererId.toString() : null,
      status: packet.status,
      deliveryPhotoKey: packet.deliveryPhotoKey
        ? packet.deliveryPhotoKey
        : null,
      deliveryPhotoMimeType: packet.deliveryPhotoMimeType
        ? packet.deliveryPhotoMimeType
        : null,
      deliveryPhotoSize: packet.deliveryPhotoSize
        ? packet.deliveryPhotoSize
        : null,
      deliveryPhotoUploadedAt: packet.deliveryPhotoUploadedAt
        ? packet.deliveryPhotoUploadedAt
        : null,
    };
  }
}
