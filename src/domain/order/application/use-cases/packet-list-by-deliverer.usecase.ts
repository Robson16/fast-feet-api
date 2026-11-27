import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListByDelivererUseCaseRequest extends PaginationParams {
  delivererId: string;
}

type PacketListByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    delivererId,
  }: PacketListByDelivererUseCaseRequest): Promise<PacketListByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findMany(
      { page },
      { delivererId },
    );

    return right({
      packets,
    });
  }
}
