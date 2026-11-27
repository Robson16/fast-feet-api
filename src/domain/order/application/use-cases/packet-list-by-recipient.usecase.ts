import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListByRecipientUseCaseRequest extends PaginationParams {
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
    const packets = await this.packetsRepository.findMany(
      { page },
      { recipientId },
    );

    return right({
      packets,
    });
  }
}
