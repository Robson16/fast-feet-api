import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

interface DestinationGetUseCaseRequest {
  destinationId: string;
}

type DestinationGetUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    destination: Destination;
  }
>;

export class DestinationGetUseCase {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async execute({
    destinationId,
  }: DestinationGetUseCaseRequest): Promise<DestinationGetUseCaseResponse> {
    const destination =
      await this.destinationsRepository.findById(destinationId);

    if (!destination) {
      return left(new ResourceNotFoundError("Destination not found."));
    }

    return right({
      destination,
    });
  }
}
