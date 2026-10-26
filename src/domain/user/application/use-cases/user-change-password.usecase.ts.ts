import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { HashComparer } from "@/domain/user/application/cryptography/hash-comparer";
import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";

import { WrongCredentialsError } from "./errors/wrong-credentials-error";

interface UserChangePasswordUseCaseRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

type UserChangePasswordUseCaseResponse = Either<
  ResourceNotFoundError | WrongCredentialsError,
  {
    user: User;
  }
>;

@Injectable()
export class UserChangePasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    currentPassword,
    newPassword,
  }: UserChangePasswordUseCaseRequest): Promise<UserChangePasswordUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    const currentPasswordCheck = await this.hashComparer.compare(
      currentPassword,
      user.password,
    );

    if (!currentPasswordCheck) {
      return left(
        new WrongCredentialsError("Current password does not match."),
      );
    }

    const hashedPassword = await this.hashGenerator.hash(newPassword);

    user.password = hashedPassword;

    await this.usersRepository.save(user);

    return right({
      user,
    });
  }
}
