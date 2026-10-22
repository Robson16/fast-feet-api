import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";
import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import { InvalidCPFError } from "./errors/invalid-cpf-error";
import { InvalidUserRole } from "./errors/invalid-user-role";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";

interface UserRegisterUseCaseRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
  role?: string;
}

type UserRegisterUseCaseResponse = Either<
  UserAlreadyExistsError | InvalidCPFError | InvalidUserRole,
  {
    user: User;
  }
>;

@Injectable()
export class UserRegisterUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  private async isCPFValid(cpf: string): Promise<boolean> {
    return CPF.validate(cpf);
  }

  private async userExistsWithCPF(cpf: string): Promise<boolean> {
    const user = await this.usersRepository.findByCPF(cpf);

    return !!user;
  }

  private async userExistsWithEmail(email: string): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);

    return !!user;
  }

  private isValidRole(role: string): boolean {
    return Role.validate(role);
  }

  async execute({
    name,
    cpf,
    email,
    password,
    role,
  }: UserRegisterUseCaseRequest): Promise<UserRegisterUseCaseResponse> {
    if (!(await this.isCPFValid(cpf))) {
      return left(new InvalidCPFError());
    }

    if (await this.userExistsWithCPF(cpf)) {
      return left(new UserAlreadyExistsError(cpf));
    }

    if (await this.userExistsWithEmail(email)) {
      return left(new UserAlreadyExistsError(email));
    }

    if (role && !this.isValidRole(role)) {
      return left(new InvalidUserRole(role));
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const user = User.create({
      name,
      cpf: CPF.create(cpf),
      email,
      password: hashedPassword,
      role: role ? new Role(role) : undefined,
    });

    await this.usersRepository.create(user);

    return right({
      user,
    });
  }
}
