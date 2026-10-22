import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketUpdateStatusToAwaitingWithdrawalUseCaseRequest {
  packetId: string;
}

type PacketUpdateStatusToAwaitingWithdrawalUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class PacketUpdateStatusToAwaitingWithdrawalUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
  }: PacketUpdateStatusToAwaitingWithdrawalUseCaseRequest): Promise<PacketUpdateStatusToAwaitingWithdrawalUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (
      packet.status === "AWAITING_WITHDRAWAL" &&
      packet.delivererId === undefined
    ) {
      return left(new NotAllowedError("Packet already awaiting withdrawal"));
    }

    packet.delivererId = undefined;
    packet.status = "AWAITING_WITHDRAWAL";

    await this.packetsRepository.save(packet);

    return right({
      packet,
    });
  }
}
