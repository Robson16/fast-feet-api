import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  PacketAddressFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListDeliveredByDelivererUseCaseRequest
  extends PaginationParams, PacketAddressFilters {
  delivererId: string;
}

type PacketListDeliveredByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListDeliveredByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    page,
    state,
    city,
    neighborhood,
  }: PacketListDeliveredByDelivererUseCaseRequest): Promise<PacketListDeliveredByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { status: "DELIVERED", delivererId, state, city, neighborhood },
    );

    return right({
      packets,
    });
  }
}
