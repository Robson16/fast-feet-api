import { PaginationParams } from "@/core/repositories/pagination-params";
import {
  Packet,
  PacketStatus,
} from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

export interface FindManyPacketsFilters {
  status?: PacketStatus;
  delivererId?: string;
  recipientId?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
}

export type PacketAddressFilters = Pick<
  FindManyPacketsFilters,
  "state" | "city" | "neighborhood"
>;

export interface FindManyNearbyPacketsParams extends PaginationParams {
  status: PacketStatus;
  delivererId: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export abstract class PacketsRepository {
  abstract findById(id: string): Promise<Packet | null>;
  abstract findDetailsById(id: string): Promise<PacketDetails | null>;
  abstract findAwaitingWithdrawalById(id: string): Promise<Packet | null>;

  abstract findMany(
    pagination: PaginationParams,
    filters?: FindManyPacketsFilters,
  ): Promise<Packet[]>;

  abstract findManyNearby(
    params: FindManyNearbyPacketsParams,
  ): Promise<Packet[]>;

  abstract create(packet: Packet): Promise<void>;
  abstract save(packet: Packet): Promise<void>;
  abstract delete(packet: Packet): Promise<void>;
}
