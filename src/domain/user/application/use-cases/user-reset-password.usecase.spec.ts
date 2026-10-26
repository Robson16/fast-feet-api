import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/user/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { UserResetPasswordUseCase } from "./user-reset-password.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: UserResetPasswordUseCase;

describe("Reset User Password", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    sut = new UserResetPasswordUseCase(inMemoryUsersRepository, fakeHasher);
  });

  it("should be able to reset a user's password", async () => {
    const user = makeUser({ password: "old-password-hash" });
    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      password: "new-password",
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items[0].password).toBe(
      await fakeHasher.hash("new-password"),
    );
  });

  it("should not be able to reset the password of a nonexistent user", async () => {
    const result = await sut.execute({
      userId: "invalid-user-id",
      password: "new-password",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
