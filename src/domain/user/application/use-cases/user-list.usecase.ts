import { Injectable } from "@nestjs/common";

import { Either, right } from "@/core/either";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";

export const USERS_PER_PAGE = 20;

interface UserListUseCaseRequest {
  page: number;
}

type UserListUseCaseResponse = Either<
  null,
  {
    users: User[];
  }
>;

@Injectable()
export class UserListUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    page,
  }: UserListUseCaseRequest): Promise<UserListUseCaseResponse> {
    const users = await this.usersRepository.findMany({ page });

    return right({ users });
  }
}
