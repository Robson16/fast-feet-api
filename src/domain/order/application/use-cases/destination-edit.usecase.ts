import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

interface DestinationEditUseCaseRequest {
  destinationId: string;
  title: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressZipCode: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCountry?: string;
  latitude: number;
  longitude: number;
}

type DestinationEditUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    destination: Destination;
  }
>;

export class DestinationEditUseCase {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async execute({
    destinationId,
    title,
    addressStreet,
    addressNumber,
    addressComplement,
    addressZipCode,
    addressNeighborhood,
    addressCity,
    addressState,
    addressCountry,
    latitude,
    longitude,
  }: DestinationEditUseCaseRequest): Promise<DestinationEditUseCaseResponse> {
    const destination =
      await this.destinationsRepository.findById(destinationId);

    if (!destination) {
      return left(new ResourceNotFoundError("Destination not found."));
    }

    destination.title = title;
    destination.addressStreet = addressStreet;
    destination.addressNumber = addressNumber;
    destination.addressComplement = addressComplement;
    destination.addressZipCode = addressZipCode;
    destination.addressNeighborhood = addressNeighborhood;
    destination.addressCity = addressCity;
    destination.addressState = addressState;
    destination.addressCountry = addressCountry;
    destination.latitude = latitude;
    destination.longitude = longitude;

    await this.destinationsRepository.save(destination);

    return right({
      destination,
    });
  }
}
