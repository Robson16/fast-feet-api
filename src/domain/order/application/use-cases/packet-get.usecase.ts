import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";
import { RoleType } from "@/domain/user/enterprise/entities/value-objects/role";

interface PacketGetUseCaseRequest {
  packetId: string;
  userId: string;
  userRole: RoleType;
}

type PacketGetUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    packet: PacketDetails;
  }
>;

@Injectable()
export class PacketGetUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
    userId,
    userRole,
  }: PacketGetUseCaseRequest): Promise<PacketGetUseCaseResponse> {
    const packet = await this.packetsRepository.findDetailsById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    const canAccess =
      userRole === "ADMIN" ||
      (userRole === "RECIPIENT" && packet.recipientId.toString() === userId) ||
      (userRole === "DELIVERER" && packet.delivererId?.toString() === userId);

    if (!canAccess) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    return right({
      packet,
    });
  }
}
