import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface PacketFetchNearbyByDelivererUseCaseRequest {
  delivererId: string;
  distance: number;
  latitude: number;
  longitude: number;
  page: number;
}

type PacketFetchNearbyByDelivererUseCaseResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class PacketFetchNearbyByDelivererUseCase {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    distance,
    latitude,
    longitude,
    page,
  }: PacketFetchNearbyByDelivererUseCaseRequest): Promise<PacketFetchNearbyByDelivererUseCaseResponse> {
    const packets =
      await this.packetsRepository.findManyNearbyByStatusAndDelivererId({
        delivererId,
        status: "WITHDRAWN",
        distance,
        latitude,
        longitude,
        pagination: { page },
      });

    return right({
      packets,
    });
  }
}
