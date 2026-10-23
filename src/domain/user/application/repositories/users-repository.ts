import { PaginationParams } from "@/core/repositories/pagination-params";

import { User } from "../../enterprise/entities/user";

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findMany(pagination: PaginationParams): Promise<User[]>;
  abstract findByCPF(cpf: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(user: User): Promise<void>;
  abstract save(user: User): Promise<void>;
  abstract delete(user: User): Promise<void>;
}
