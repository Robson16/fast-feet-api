import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import {
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchDeliveredByDelivererUseCaseRequest {
  delivererId: string;
  page: number;
  filters?: PacketsFilters;
}

type PacketFetchDeliveredByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketFetchDeliveredByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    page,
    filters,
  }: PacketFetchDeliveredByDelivererUseCaseRequest): Promise<PacketFetchDeliveredByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findManyByStatusAndDelivererId(
      "DELIVERED",
      delivererId,
      { page },
      filters,
    );

    return right({
      packets,
    });
  }
}
