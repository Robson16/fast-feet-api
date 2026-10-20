import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";

interface CreateDestinationUseCaseRequest {
  recipientId: string;
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

type CreateDestinationUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    destination: Destination;
  }
>;

@Injectable()
export class CreateDestinationUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private destinationsRepository: DestinationsRepository,
  ) {}

  async execute({
    recipientId,
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
  }: CreateDestinationUseCaseRequest): Promise<CreateDestinationUseCaseResponse> {
    const isRecipientExistent =
      await this.usersRepository.findById(recipientId);

    if (!isRecipientExistent) {
      return left(new ResourceNotFoundError("Recipient not found."));
    }

    const destination = Destination.create({
      recipientId: new UniqueEntityID(recipientId),
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
    });

    await this.destinationsRepository.create(destination);

    return right({
      destination,
    });
  }
}
