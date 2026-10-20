import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";

interface DeletePacketUseCaseRequest {
  packetId: string;
}

type DeletePacketUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeletePacketUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    packetId,
  }: DeletePacketUseCaseRequest): Promise<DeletePacketUseCaseResponse> {
    const packet = await this.packetsRepository.findById(packetId);

    if (!packet) {
      return left(new ResourceNotFoundError("Packet not found."));
    }

    await this.packetsRepository.delete(packet);

    return right(null);
  }
}
