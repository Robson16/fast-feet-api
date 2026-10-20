import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";

interface FetchPacketsNearbyByDelivererRequest {
  delivererId: string;
  distance: number;
  latitude: number;
  longitude: number;
  page: number;
}

type FetchPacketsNearbyByDelivererResponse = Either<
  null,
  {
    packets: Packet[];
  }
>;

@Injectable()
export class FetchPacketsNearbyByDeliverer {
  constructor(private packetsRepository: PacketsRepository) {}

  async execute({
    delivererId,
    distance,
    latitude,
    longitude,
    page,
  }: FetchPacketsNearbyByDelivererRequest): Promise<FetchPacketsNearbyByDelivererResponse> {
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
