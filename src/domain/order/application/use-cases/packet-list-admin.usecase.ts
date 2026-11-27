import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  FindManyPacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListAdminUseCaseRequest
  extends PaginationParams, FindManyPacketsFilters {}

type PacketListAdminUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListAdminUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    ...filters
  }: PacketListAdminUseCaseRequest): Promise<PacketListAdminUseCaseResponse> {
    const packets = await this.packetsRepository.findMany({ page }, filters);

    return right({
      packets,
    });
  }
}
