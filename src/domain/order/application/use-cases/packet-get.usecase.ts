import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

interface PacketGetUseCaseRequest {
  packetId: string;
}

type PacketGetUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    packet: PacketDetails;
  }
>;

export class PacketGetUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
  }: PacketGetUseCaseRequest): Promise<PacketGetUseCaseResponse> {
    const packet = await this.packetsRepository.findDetailsById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    return right({
      packet,
    });
  }
}
