import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  PacketAddressFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListReturnedUseCaseRequest
  extends PaginationParams, PacketAddressFilters {}

type PacketListReturnedUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListReturnedUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    state,
    city,
    neighborhood,
  }: PacketListReturnedUseCaseRequest): Promise<PacketListReturnedUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { status: "RETURNED", state, city, neighborhood },
    );

    return right({
      packets,
    });
  }
}
