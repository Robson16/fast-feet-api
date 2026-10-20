import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import {
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface FetchPacketsWithdrawnByDelivererUseCaseRequest {
  delivererId: string;
  page: number;
  filters?: PacketsFilters;
}

type FetchPacketsWithdrawnByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class FetchPacketsWithdrawnByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    page,
    filters,
  }: FetchPacketsWithdrawnByDelivererUseCaseRequest): Promise<FetchPacketsWithdrawnByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findManyByStatusAndDelivererId(
      "WITHDRAWN",
      delivererId,
      { page },
      filters,
    );

    return right({
      packets,
    });
  }
}
