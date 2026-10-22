import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";

interface PacketDeleteUseCaseRequest {
  packetId: string;
}

type PacketDeleteUseCaseResponse = Either<ResourceNotFoundError, null>;

export class PacketDeleteUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
  }: PacketDeleteUseCaseRequest): Promise<PacketDeleteUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    await this.packetsRepository.delete(packet);

    return right(null);
  }
}
