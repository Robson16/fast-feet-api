import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  Packet,
  PacketStatus,
} from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

export interface PacketsFilters {
  state?: string;
  city?: string;
  neighborhood?: string;
}

export interface FindManyNearbyByStatusAndDelivererIdParams {
  status: PacketStatus;
  delivererId: string;
  distance: number;
  latitude: number;
  longitude: number;
  pagination: PaginationParams;
}

export abstract class PacketsRepository {
  abstract findById(id: string): Promise<Packet | null>;
  abstract findDetailsById(id: string): Promise<PacketDetails | null>;
  abstract findAwaitingWithdrawalById(id: string): Promise<Packet | null>;

  abstract findManyByStatus(
    status: PacketStatus,
    pagination: PaginationParams,
  ): Promise<Packet[]>;

  abstract findManyByStatusAndDelivererId(
    status: PacketStatus,
    delivererId: string,
    pagination: PaginationParams,
    filters?: PacketsFilters,
  ): Promise<Packet[]>;

  abstract findManyNearbyByStatusAndDelivererId(
    params: FindManyNearbyByStatusAndDelivererIdParams,
  ): Promise<Packet[]>;

  abstract create(packet: Packet): Promise<void>;
  abstract save(packet: Packet): Promise<void>;
  abstract delete(packet: Packet): Promise<void>;
}
