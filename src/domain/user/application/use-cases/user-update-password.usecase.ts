import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { User } from "@/domain/user/enterprise/entities/user";

import { HashGenerator } from "../cryptography/hash-generator";
import { UsersRepository } from "../repositories/users-repository";

interface UserUpdatePasswordUseCaseRequest {
  userId: string;
  password: string;
}

type UserUpdatePasswordUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    user: User;
  }
>;

@Injectable()
export class UserUpdatePasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    password,
  }: UserUpdatePasswordUseCaseRequest): Promise<UserUpdatePasswordUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    user.password = hashedPassword;

    await this.usersRepository.save(user);

    return right({
      user,
    });
  }
}
