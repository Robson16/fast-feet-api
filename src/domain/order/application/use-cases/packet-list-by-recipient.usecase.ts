import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

export const PACKETS_PER_PAGE = 20;

interface PacketListByRecipientUseCaseRequest {
  page: number;
  recipientId: string;
}

type PacketListByRecipientUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListByRecipientUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    page,
    recipientId,
  }: PacketListByRecipientUseCaseRequest): Promise<PacketListByRecipientUseCaseResponse> {
    const packets = await this.packetsRepository.findManyByRecipientId(
      recipientId,
      { page },
    );

    return right({
      packets,
    });
  }
}
