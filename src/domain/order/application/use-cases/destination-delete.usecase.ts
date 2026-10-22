import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";

interface DestinationDeleteUseCaseRequest {
  destinationId: string;
}

type DestinationDeleteUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DestinationDeleteUseCase {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async execute({
    destinationId,
  }: DestinationDeleteUseCaseRequest): Promise<DestinationDeleteUseCaseResponse> {
    const destination =
      await this.destinationsRepository.findById(destinationId);

    if (!destination) {
      return left(new ResourceNotFoundError("Destination not found."));
    }

    await this.destinationsRepository.delete(destination);

    return right(null);
  }
}
