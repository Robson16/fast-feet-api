import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";

interface UserGetUseCaseRequest {
  userId: string;
}

type UserGetUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    user: User;
  }
>;

@Injectable()
export class UserGetUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: UserGetUseCaseRequest): Promise<UserGetUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    return right({
      user,
    });
  }
}
