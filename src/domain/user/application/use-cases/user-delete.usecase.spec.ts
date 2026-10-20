import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { DeleteUserUseCase } from "./user-delete.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: DeleteUserUseCase; // Subject Under Test

describe("Delete User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new DeleteUserUseCase(inMemoryUsersRepository);
  });

  it("should be able to delete a user", async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items).toHaveLength(0);
  });

  it("should not be able to delete a non-existent user", async () => {
    const result = await sut.execute({
      userId: "non-existent-user-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
