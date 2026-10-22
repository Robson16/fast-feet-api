import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketUpdateStatusToDeliveredUseCaseRequest {
  delivererId: string;
  packetId: string;
}

type PacketUpdateStatusToDeliveredUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class PacketUpdateStatusToDeliveredUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    packetId,
  }: PacketUpdateStatusToDeliveredUseCaseRequest): Promise<PacketUpdateStatusToDeliveredUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (packet.status === "DELIVERED") {
      return left(new NotAllowedError("Packet already delivered."));
    }

    if (
      packet.status !== "WITHDRAWN" ||
      !packet.delivererId ||
      packet.delivererId.toString() !== delivererId
    ) {
      return left(new NotAllowedError("No deliverer withdrew this packet."));
    }

    packet.status = "DELIVERED";

    await this.packetsRepository.save(packet);

    return right({
      packet,
    });
  }
}
