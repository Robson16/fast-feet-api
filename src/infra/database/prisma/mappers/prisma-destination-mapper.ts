import { Destination as PrismaDestination, Prisma } from "@prisma/client";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Destination } from "@/domain/order/enterprise/entities/destination";

export class PrismaDestinationMapper {
  static toDomain(raw: PrismaDestination): Destination {
    return Destination.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        title: raw.title,
        addressStreet: raw.addressStreet,
        addressNumber: raw.addressNumber,
        addressComplement: raw.addressComplement ?? "",
        addressZipCode: raw.addressZipCode,
        addressNeighborhood: raw.addressNeighborhood,
        addressCity: raw.addressCity,
        addressState: raw.addressState,
        addressCountry: raw.addressCountry ?? undefined,
        latitude: Number(raw.latitude),
        longitude: Number(raw.longitude),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    destination: Destination,
  ): Prisma.DestinationUncheckedCreateInput {
    return {
      id: destination.id.toString(),
      recipientId: destination.recipientId.toString(),
      title: destination.title,
      addressStreet: destination.addressStreet,
      addressNumber: destination.addressNumber,
      addressComplement: destination.addressComplement,
      addressZipCode: destination.addressZipCode,
      addressNeighborhood: destination.addressNeighborhood,
      addressCity: destination.addressCity,
      addressState: destination.addressState,
      addressCountry: destination.addressCountry,
      latitude: destination.latitude,
      longitude: destination.longitude,
      createdAt: destination.createdAt,
      updatedAt: destination.updatedAt,
    };
  }
}
