import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from "@/core/repositories/pagination-params";
import { getDistanceBetweenCoordinates } from "@/core/utils/get-distance-between-coordinates";
import {
  FindManyNearbyPacketsParams,
  FindManyPacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";
import { PrismaPacketDetailsMapper } from "@/infra/database/prisma/mappers/prisma-packet-details-mapper";
import { PrismaPacketMapper } from "@/infra/database/prisma/mappers/prisma-packet-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

const DEFAULT_ORDER_BY: Prisma.PacketOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "asc" },
];

@Injectable()
export class PrismaPacketsRepository implements PacketsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Packet | null> {
    const packet = await this.prisma.packet.findUnique({ where: { id } });

    return packet ? PrismaPacketMapper.toDomain(packet) : null;
  }

  async findDetailsById(id: string): Promise<PacketDetails | null> {
    const packet = await this.prisma.packet.findUnique({
      where: { id },
      include: {
        destination: {
          include: {
            recipient: true,
          },
        },
      },
    });

    return packet ? PrismaPacketDetailsMapper.toDomain(packet) : null;
  }

  async findAwaitingWithdrawalById(id: string): Promise<Packet | null> {
    const packet = await this.prisma.packet.findFirst({
      where: {
        id,
        status: "AWAITING_WITHDRAWAL",
      },
    });

    return packet ? PrismaPacketMapper.toDomain(packet) : null;
  }

  async findMany(
    { page }: PaginationParams,
    filters?: FindManyPacketsFilters,
  ): Promise<Packet[]> {
    const destinationFilter: Prisma.DestinationWhereInput = {
      ...(filters?.recipientId && { recipientId: filters.recipientId }),
      ...(filters?.neighborhood && {
        addressNeighborhood: {
          contains: filters.neighborhood,
          mode: "insensitive",
        },
      }),
      ...(filters?.city && {
        addressCity: {
          contains: filters.city,
          mode: "insensitive",
        },
      }),
      ...(filters?.state && {
        addressState: {
          contains: filters.state,
          mode: "insensitive",
        },
      }),
    };

    const where: Prisma.PacketWhereInput = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.delivererId && { delivererId: filters.delivererId }),
      ...(Object.keys(destinationFilter).length > 0 && {
        destination: destinationFilter,
      }),
    };

    const packets = await this.prisma.packet.findMany({
      where,
      skip: (page - 1) * DEFAULT_PER_PAGE,
      take: DEFAULT_PER_PAGE,
      orderBy: DEFAULT_ORDER_BY,
    });

    return packets.map(PrismaPacketMapper.toDomain);
  }

  async findManyNearby(params: FindManyNearbyPacketsParams): Promise<Packet[]> {
    const packets = await this.prisma.packet.findMany({
      where: {
        status: params.status,
        delivererId: params.delivererId,
      },
      include: {
        destination: true,
      },
      orderBy: DEFAULT_ORDER_BY,
    });

    const nearbyPackets = packets.filter((packet) => {
      const distance = getDistanceBetweenCoordinates(
        {
          latitude: params.latitude,
          longitude: params.longitude,
        },
        {
          latitude: Number(packet.destination.latitude),
          longitude: Number(packet.destination.longitude),
        },
      );

      return distance <= params.distance;
    });

    const startIndex = (params.page - 1) * DEFAULT_PER_PAGE;

    return nearbyPackets
      .slice(startIndex, startIndex + DEFAULT_PER_PAGE)
      .map(PrismaPacketMapper.toDomain);
  }

  async create(packet: Packet): Promise<void> {
    await this.prisma.packet.create({
      data: PrismaPacketMapper.toPrisma(packet),
    });
  }

  async save(packet: Packet): Promise<void> {
    const data = PrismaPacketMapper.toPrisma(packet);

    await this.prisma.packet.update({
      where: { id: data.id },
      data,
    });
  }

  async delete(packet: Packet): Promise<void> {
    await this.prisma.packet.delete({
      where: { id: packet.id.toString() },
    });
  }
}
