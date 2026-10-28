import { Injectable } from "@nestjs/common";

import {
  Destination,
  DestinationProps,
} from "@/domain/order/enterprise/entities/destination";
import { PrismaDestinationMapper } from "@/infra/database/prisma/mappers/prisma-destination-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

import { destinationMaker } from "./destination-maker";

@Injectable()
export class DestinationFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaDestination(
    data: Partial<DestinationProps> = {},
  ): Promise<Destination> {
    const destination = destinationMaker(data);

    await this.prisma.destination.create({
      data: PrismaDestinationMapper.toPrisma(destination),
    });

    return destination;
  }
}
