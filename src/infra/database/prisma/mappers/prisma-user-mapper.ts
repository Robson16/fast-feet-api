import { Prisma, User as PrismaUser } from "@prisma/client";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User } from "@/domain/user/enterprise/entities/user";
import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        cpf: CPF.create(raw.cpf),
        email: raw.email,
        password: raw.password,
        role: Role.create(raw.role),
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      name: user.name,
      cpf: user.cpf.value,
      email: user.email,
      password: user.password,
      role: user.role.value,
    };
  }
}
