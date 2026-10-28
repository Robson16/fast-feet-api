import { faker } from "@faker-js/faker";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User, UserProps } from "@/domain/user/enterprise/entities/user";
import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

export function userMaker(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
): User {
  const user = User.create(
    {
      name: faker.person.fullName(),
      cpf: CPF.generate(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: Role.create("DELIVERER"),
      ...override,
    },
    id,
  );

  return user;
}
