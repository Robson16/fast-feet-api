import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  PacketAddressFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchAwaitingUseCaseRequest
  extends PaginationParams, PacketAddressFilters {}

type PacketFetchAwaitingUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketFetchAwaitingUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    state,
    city,
    neighborhood,
  }: PacketFetchAwaitingUseCaseRequest): Promise<PacketFetchAwaitingUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { status: "AWAITING_WITHDRAWAL", state, city, neighborhood },
    );

    return right({
      packets,
    });
  }
}
