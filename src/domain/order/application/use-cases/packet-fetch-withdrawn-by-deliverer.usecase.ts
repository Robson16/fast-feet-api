import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  PacketAddressFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchWithdrawnByDelivererUseCaseRequest
  extends PaginationParams, PacketAddressFilters {
  delivererId: string;
}

type PacketFetchWithdrawnByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketFetchWithdrawnByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    page,
    state,
    city,
    neighborhood,
  }: PacketFetchWithdrawnByDelivererUseCaseRequest): Promise<PacketFetchWithdrawnByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { status: "WITHDRAWN", delivererId, state, city, neighborhood },
    );

    return right({
      packets,
    });
  }
}
