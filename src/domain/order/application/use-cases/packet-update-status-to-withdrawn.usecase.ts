import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";

import { UnavailablePacketError } from "./errors/unavailable-packet-error";

interface PacketUpdateStatusToWithdrawnUseCaseRequest {
  delivererId: string;
  packetId: string;
}

type PacketUpdateStatusToWithdrawnUseCaseResponse = Either<
  ResourceNotFoundError | UnavailablePacketError | NotAllowedError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class PacketUpdateStatusToWithdrawnUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private packetsRepository: PacketsRepository,
  ) {}

  async execute({
    delivererId,
    packetId,
  }: PacketUpdateStatusToWithdrawnUseCaseRequest): Promise<PacketUpdateStatusToWithdrawnUseCaseResponse> {
    const deliverer = await this.usersRepository.findById(delivererId);

    if (!deliverer) {
      return left(new ResourceNotFoundError("Deliverer not found."));
    }

    if (deliverer.role.value !== "DELIVERER") {
      return left(new NotAllowedError("Only deliverers can withdraw packets."));
    }

    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    if (packet.status !== "AWAITING_WITHDRAWAL") {
      return left(
        new UnavailablePacketError("Packet unavailable to withdrawal."),
      );
    }

    packet.delivererId = new UniqueEntityID(delivererId);
    packet.status = "WITHDRAWN";

    await this.packetsRepository.save(packet);

    return right({
      packet,
    });
  }
}
