import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { User } from "@/domain/user/enterprise/entities/user";
import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

import { HashGenerator } from "../cryptography/hash-generator";
import { UsersRepository } from "../repositories/users-repository";
import { InvalidCPFError } from "./errors/invalid-cpf-error";
import { InvalidUserRole } from "./errors/invalid-user-role";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";

interface EditUserUseCaseRequest {
  userId: string;
  name?: string;
  cpf?: string;
  email?: string;
  password?: string;
  role?: string;
}

type EditUserUseCaseResponse = Either<
  | ResourceNotFoundError
  | UserAlreadyExistsError
  | InvalidCPFError
  | InvalidUserRole,
  {
    user: User;
  }
>;

@Injectable()
export class EditUserUseCase {
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
    userId,
    name,
    cpf,
    email,
    password,
    role,
  }: EditUserUseCaseRequest): Promise<EditUserUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    if (cpf && !(await this.isCPFValid(cpf))) {
      return left(new InvalidCPFError());
    }

    if (cpf && (await this.userExistsWithCPF(cpf))) {
      return left(new UserAlreadyExistsError(cpf));
    }

    if (email && (await this.userExistsWithEmail(email))) {
      return left(new UserAlreadyExistsError(email));
    }

    if (role && !this.isValidRole(role)) {
      return left(new InvalidUserRole(role));
    }

    const hashedPassword = password
      ? await this.hashGenerator.hash(password)
      : user.password;

    user.name = name || user.name;
    user.cpf = cpf ? CPF.create(cpf) : user.cpf;
    user.email = email || user.email;
    user.password = hashedPassword;
    user.role = role ? Role.create(role) : user.role;

    await this.usersRepository.save(user);

    return right({
      user,
    });
  }
}
