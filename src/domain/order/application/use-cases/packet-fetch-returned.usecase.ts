import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  PacketAddressFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchReturnedUseCaseRequest
  extends PaginationParams, PacketAddressFilters {}

type PacketFetchReturnedUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketFetchReturnedUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    state,
    city,
    neighborhood,
  }: PacketFetchReturnedUseCaseRequest): Promise<PacketFetchReturnedUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { status: "RETURNED", state, city, neighborhood },
    );

    return right({
      packets,
    });
  }
}
