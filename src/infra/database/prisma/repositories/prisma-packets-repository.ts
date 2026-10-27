import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { getDistanceBetweenCoordinates } from "@/core/utils/get-distance-between-coordinates";
import {
  FindManyNearbyByStatusAndDelivererIdParams,
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import {
  Packet,
  PacketStatus,
} from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";
import { PrismaPacketDetailsMapper } from "@/infra/database/prisma/mappers/prisma-packet-details-mapper";
import { PrismaPacketMapper } from "@/infra/database/prisma/mappers/prisma-packet-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

@Injectable()
export class PrismaPacketsRepository implements PacketsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Packet | null> {
    const packet = await this.prisma.packet.findUnique({
      where: {
        id,
      },
    });

    if (!packet) {
      return null;
    }

    return PrismaPacketMapper.toDomain(packet);
  }

  async findDetailsById(id: string): Promise<PacketDetails | null> {
    const packet = await this.prisma.packet.findUnique({
      where: {
        id,
      },
      include: {
        destination: {
          include: {
            recipient: true,
          },
        },
      },
    });

    if (!packet) {
      return null;
    }

    return PrismaPacketDetailsMapper.toDomain(packet);
  }

  async findAwaitingWithdrawalById(id: string): Promise<Packet | null> {
    const packet = await this.prisma.packet.findFirst({
      where: {
        id,
        status: "AWAITING_WITHDRAWAL",
      },
    });

    if (!packet) {
      return null;
    }

    return PrismaPacketMapper.toDomain(packet);
  }

  async findManyByStatus(
    status: PacketStatus,
    { page }: PaginationParams,
  ): Promise<Packet[]> {
    const packets = await this.prisma.packet.findMany({
      where: {
        status,
      },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return packets.map(PrismaPacketMapper.toDomain);
  }

  async findManyByStatusAndDelivererId(
    status: PacketStatus,
    delivererId: string,
    { page }: PaginationParams,
    filters?: PacketsFilters,
  ): Promise<Packet[]> {
    const where: Prisma.PacketWhereInput = {
      status,
      delivererId,
    };

    if (filters) {
      if (filters.neighborhood || filters.city) {
        where.destination = {
          ...(filters.neighborhood && {
            addressNeighborhood: {
              contains: filters.neighborhood,
              mode: "insensitive",
            },
          }),
          ...(filters.city && {
            addressCity: {
              contains: filters.city,
            },
          }),
          ...(filters.state && {
            addressState: {
              contains: filters.state,
            },
          }),
        };
      }
    }

    const packets = await this.prisma.packet.findMany({
      where,
      skip: (page - 1) * 20,
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    return packets.map(PrismaPacketMapper.toDomain);
  }

  async findManyNearbyByStatusAndDelivererId(
    params: FindManyNearbyByStatusAndDelivererIdParams,
  ): Promise<Packet[]> {
    const packets = await this.prisma.packet.findMany({
      where: {
        status: params.status,
        delivererId: params.delivererId,
      },
      include: {
        destination: true,
      },
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

    const paginatedPackets = nearbyPackets.slice(
      (params.pagination.page - 1) * 20,
      params.pagination.page * 20,
    );

    return paginatedPackets.map(PrismaPacketMapper.toDomain);
  }

  async findManyByRecipientId(
    recipientId: string,
    { page }: PaginationParams,
  ): Promise<Packet[]> {
    const packets = await this.prisma.packet.findMany({
      where: {
        destination: {
          recipientId,
        },
      },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return packets.map(PrismaPacketMapper.toDomain);
  }

  async create(packet: Packet): Promise<void> {
    const data = PrismaPacketMapper.toPrisma(packet);

    await this.prisma.packet.create({
      data,
    });
  }

  async save(packet: Packet): Promise<void> {
    const data = PrismaPacketMapper.toPrisma(packet);

    await this.prisma.packet.update({
      where: {
        id: data.id,
      },
      data,
    });
  }

  async delete(packet: Packet): Promise<void> {
    const data = PrismaPacketMapper.toPrisma(packet);

    await this.prisma.packet.delete({
      where: {
        id: data.id,
      },
    });
  }
}
