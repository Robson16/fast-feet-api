import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/repositories/pagination-params";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketListNearbyByDelivererUseCaseRequest extends PaginationParams {
  delivererId: string;
  distance: number;
  latitude: number;
  longitude: number;
}

type PacketListNearbyByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketListNearbyByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    distance,
    latitude,
    longitude,
    page,
  }: PacketListNearbyByDelivererUseCaseRequest): Promise<PacketListNearbyByDelivererUseCaseResponse> {
    const packets = await this.packetsRepository.findManyNearby({
      delivererId,
      status: "WITHDRAWN",
      distance,
      latitude,
      longitude,
      page,
    });

    return right({
      packets,
    });
  }
}
