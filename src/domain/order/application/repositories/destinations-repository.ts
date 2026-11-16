import { PaginationParams } from "@/core/repositories/pagination-params";
import { Destination } from "@/domain/order/enterprise/entities/destination";

export abstract class DestinationsRepository {
  abstract findById(id: string): Promise<Destination | null>;
  abstract findMany(params: PaginationParams): Promise<Destination[]>;
  abstract create(destination: Destination): Promise<void>;
  abstract save(destination: Destination): Promise<void>;
  abstract delete(destination: Destination): Promise<void>;
}
