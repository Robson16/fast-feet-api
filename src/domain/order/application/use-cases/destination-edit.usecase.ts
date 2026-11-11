import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

interface DestinationEditUseCaseRequest {
  destinationId: string;
  title?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressZipCode?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  latitude?: number;
  longitude?: number;
}

type DestinationEditUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    destination: Destination;
  }
>;

@Injectable()
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

    destination.title = title ?? destination.title;
    destination.addressStreet = addressStreet ?? destination.addressStreet;
    destination.addressNumber = addressNumber ?? destination.addressNumber;
    destination.addressComplement =
      addressComplement ?? destination.addressComplement;
    destination.addressZipCode = addressZipCode ?? destination.addressZipCode;
    destination.addressNeighborhood =
      addressNeighborhood ?? destination.addressNeighborhood;
    destination.addressCity = addressCity ?? destination.addressCity;
    destination.addressState = addressState ?? destination.addressState;
    destination.addressCountry = addressCountry ?? destination.addressCountry;
    destination.latitude = latitude ?? destination.latitude;
    destination.longitude = longitude ?? destination.longitude;

    await this.destinationsRepository.save(destination);

    return right({
      destination,
    });
  }
}
