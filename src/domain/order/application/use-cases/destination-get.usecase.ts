import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

interface GetDestinationUseCaseRequest {
  destinationId: string;
}

type GetDestinationUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    destination: Destination;
  }
>;

export class GetDestinationUseCase {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async execute({
    destinationId,
  }: GetDestinationUseCaseRequest): Promise<GetDestinationUseCaseResponse> {
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
