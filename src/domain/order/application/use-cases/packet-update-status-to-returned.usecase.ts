import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface UpdatePacketStatusToReturnedUseCaseRequest {
  packetId: string;
}

type UpdatePacketStatusToReturnedUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class UpdatePacketStatusToReturnedUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
  }: UpdatePacketStatusToReturnedUseCaseRequest): Promise<UpdatePacketStatusToReturnedUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (packet.status === "RETURNED" && packet.delivererId === undefined) {
      return left(new NotAllowedError("Packet already returned."));
    }

    packet.delivererId = undefined;
    packet.status = "RETURNED";

    await this.packetsRepository.save(packet);

    return right({
      packet,
    });
  }
}
