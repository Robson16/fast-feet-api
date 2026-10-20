import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

import { CPF } from "./value-objects/cpf";
import { Role } from "./value-objects/role";

export interface UserProps {
  name: string;
  cpf: CPF;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;

    this.touch();
  }

  get cpf() {
    return this.props.cpf;
  }

  set cpf(cpf: CPF) {
    this.props.cpf = cpf;

    this.touch();
  }

  get email() {
    return this.props.email;
  }

  set email(email: string) {
    this.props.email = email;

    this.touch();
  }

  get password() {
    return this.props.password;
  }

  set password(password: string) {
    this.props.password = password;

    this.touch();
  }

  get role() {
    return this.props.role;
  }

  set role(role: Role) {
    this.props.role = role;

    this.touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<UserProps, "role" | "createdAt">,
    id?: UniqueEntityID,
  ) {
    const user = new User(
      {
        ...props,
        role: props.role ?? new Role("DELIVERER"),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return user;
  }
}
