import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import {
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface FetchPacketsDeliveredByDelivererUseCaseRequest {
  delivererId: string;
  page: number;
  filters?: PacketsFilters;
}

type FetchPacketsDeliveredByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class FetchPacketsDeliveredByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    page,
    filters,
  }: FetchPacketsDeliveredByDelivererUseCaseRequest): Promise<FetchPacketsDeliveredByDelivererUseCaseResponse> {
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
