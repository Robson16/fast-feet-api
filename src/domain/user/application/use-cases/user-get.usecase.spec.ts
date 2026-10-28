import { userMaker } from "test/factories/user/user-maker";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { UserGetUseCase } from "./user-get.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: UserGetUseCase; // Subject Under Test

describe("Get User Use Case", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new UserGetUseCase(inMemoryUsersRepository);
  });

  it("should be able to get user by id", async () => {
    const user = userMaker();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      user,
    });
  });

  it("should return an error if user is not found", async () => {
    const result = await sut.execute({
      userId: "non-existent-user-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
