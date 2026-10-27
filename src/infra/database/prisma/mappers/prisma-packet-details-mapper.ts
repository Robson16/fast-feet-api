import {
  Destination as PrismaDestination,
  Packet as PrismaPacket,
  User as PrismaUser,
} from "@prisma/client";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

type PrismaPacketDetails = PrismaPacket & {
  destination: PrismaDestination & {
    recipient: PrismaUser;
  };
};

export class PrismaPacketDetailsMapper {
  static toDomain(raw: PrismaPacketDetails): PacketDetails {
    return PacketDetails.create({
      packetId: new UniqueEntityID(raw.id),
      destinationId: new UniqueEntityID(raw.destinationId),
      recipient: raw.destination.recipient.name,
      addressStreet: raw.destination.addressStreet,
      addressNumber: raw.destination.addressNumber,
      addressComplement: raw.destination.addressComplement ?? "",
      addressZipCode: raw.destination.addressZipCode,
      addressNeighborhood: raw.destination.addressNeighborhood,
      addressCity: raw.destination.addressCity,
      addressState: raw.destination.addressState,
      addressCountry: raw.destination.addressCountry ?? undefined,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
