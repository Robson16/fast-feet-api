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
    };
  }
}
