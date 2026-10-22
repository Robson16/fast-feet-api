import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";

interface UserDeleteUseCaseRequest {
  userId: string;
}

type UserDeleteUseCaseResponse = Either<ResourceNotFoundError, null>;

@Injectable()
export class UserDeleteUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: UserDeleteUseCaseRequest): Promise<UserDeleteUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError("User not found."));
    }

    await this.usersRepository.delete(user);

    return right(null);
  }
}
