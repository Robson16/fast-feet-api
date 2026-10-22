import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchAwaitingUseCaseRequest {
  page: number;
}

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
  }: PacketFetchAwaitingUseCaseRequest): Promise<PacketFetchAwaitingUseCaseResponse> {
    const packets = await this.packetsRepository.findManyByStatus(
      "AWAITING_WITHDRAWAL",
      { page },
    );

    return right({
      packets,
    });
  }
}
