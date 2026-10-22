import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import {
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchWithdrawnByDelivererUseCaseRequest {
  delivererId: string;
  page: number;
  filters?: PacketsFilters;
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
    filters,
  }: PacketFetchWithdrawnByDelivererUseCaseRequest): Promise<PacketFetchWithdrawnByDelivererUseCaseResponse> {
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
