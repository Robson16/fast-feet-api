import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";

import { CPF } from "../../enterprise/entities/value-objects/cpf";
import { Encrypter } from "../cryptography/encrypter";
import { HashComparer } from "../cryptography/hash-comparer";
import { UsersRepository } from "../repositories/users-repository";
import { InvalidCPFError } from "./errors/invalid-cpf-error";
import { WrongCredentialsError } from "./errors/wrong-credentials-error";

interface AuthenticateUserUseCaseRequest {
  cpf: string;
  password: string;
}

type AuthenticateUserUseCaseResponse = Either<
  InvalidCPFError | WrongCredentialsError,
  {
    accessToken: string;
  }
>;

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private userRepository: UsersRepository,
    private hashCompare: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    cpf,
    password,
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    const isCPFValid = CPF.validate(cpf);

    if (!isCPFValid) {
      return left(new InvalidCPFError());
    }

    const user = await this.userRepository.findByCPF(cpf);

    if (!user) {
      return left(new WrongCredentialsError());
    }

    const isPasswordValid = await this.hashCompare.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return left(new WrongCredentialsError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    });

    return right({
      accessToken,
    });
  }
}
