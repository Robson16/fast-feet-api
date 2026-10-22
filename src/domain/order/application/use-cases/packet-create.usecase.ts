import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketCreateUseCaseRequest {
  destinationId: string;
}

type PacketCreateUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    packet: Packet;
  }
>;

@Injectable()
export class PacketCreateUseCase {
  constructor(
    private destinationsRepository: DestinationsRepository,
    private packetsRepository: PacketsRepository,
  ) {}

  private async isDestinationExistent(destinationId: string): Promise<boolean> {
    const destination =
      await this.destinationsRepository.findById(destinationId);

    return !!destination;
  }

  async execute({
    destinationId,
  }: PacketCreateUseCaseRequest): Promise<PacketCreateUseCaseResponse> {
    if (!(await this.isDestinationExistent(destinationId))) {
      return left(new ResourceNotFoundError("Destination not found."));
    }

    const packet = Packet.create({
      destinationId: new UniqueEntityID(destinationId),
    });

    await this.packetsRepository.create(packet);

    return right({
      packet,
    });
  }
}
