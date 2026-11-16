import { Injectable } from "@nestjs/common";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";
import { PrismaDestinationMapper } from "@/infra/database/prisma/mappers/prisma-destination-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

@Injectable()
export class PrismaDestinationsRepository implements DestinationsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Destination | null> {
    const destination = await this.prisma.destination.findUnique({
      where: {
        id,
      },
    });

    if (!destination) {
      return null;
    }

    return PrismaDestinationMapper.toDomain(destination);
  }

  async findMany({ page }: PaginationParams): Promise<Destination[]> {
    const destinations = await this.prisma.destination.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 20,
      skip: (page - 1) * 20,
    });

    return destinations.map(PrismaDestinationMapper.toDomain);
  }

  async create(destination: Destination): Promise<void> {
    const data = PrismaDestinationMapper.toPrisma(destination);

    await this.prisma.destination.create({
      data,
    });
  }

  async save(destination: Destination): Promise<void> {
    const data = PrismaDestinationMapper.toPrisma(destination);

    await this.prisma.destination.update({
      where: {
        id: data.id,
      },
      data,
    });
  }

  async delete(destination: Destination): Promise<void> {
    const data = PrismaDestinationMapper.toPrisma(destination);

    await this.prisma.destination.delete({
      where: {
        id: data.id,
      },
    });
  }
}
