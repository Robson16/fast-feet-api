import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { HashGenerator } from "@/domain/user/application/cryptography/hash-generator";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";

interface UserResetPasswordUseCaseRequest {
  userId: string;
  password: string;
}

type UserResetPasswordUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    user: User;
  }
>;

@Injectable()
export class UserResetPasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    password,
  }: UserResetPasswordUseCaseRequest): Promise<UserResetPasswordUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    user.password = await this.hashGenerator.hash(password);

    await this.usersRepository.save(user);

    return right({ user });
  }
}
