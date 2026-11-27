import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

interface DestinationListUseCaseRequest extends PaginationParams {}

type DestinationListUseCaseResponse = Either<
  null,
  {
    destinations: Destination[];
  }
>;

@Injectable()
export class DestinationListUseCase {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async execute({
    page,
  }: DestinationListUseCaseRequest): Promise<DestinationListUseCaseResponse> {
    const destinations = await this.destinationsRepository.findMany({ page });

    return right({
      destinations,
    });
  }
}
