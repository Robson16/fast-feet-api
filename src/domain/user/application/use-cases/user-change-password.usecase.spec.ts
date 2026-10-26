import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/user/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { WrongCredentialsError } from "./errors/wrong-credentials-error";
import { UserChangePasswordUseCase } from "./user-change-password.usecase.ts.js";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: UserChangePasswordUseCase; // Subject Under Test

describe("Update User Password", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    sut = new UserChangePasswordUseCase(
      inMemoryUsersRepository,
      fakeHasher,
      fakeHasher,
    );
  });

  it("should be able to update a user password", async () => {
    const user = makeUser({
      password: await fakeHasher.hash("current-password"),
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      currentPassword: "current-password",
      newPassword: "654321",
    });

    const hashedPassword = await fakeHasher.hash("654321");

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items[0].password).toEqual(hashedPassword);
  });

  it("should not be able to update the password for a nonexistent user", async () => {
    const result = await sut.execute({
      userId: "invalid-user-id",
      currentPassword: "current-password",
      newPassword: "654321",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to update the password with an incorrect current password", async () => {
    const user = makeUser({
      password: await fakeHasher.hash("current-password"),
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      currentPassword: "incorrect-password",
      newPassword: "654321",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(WrongCredentialsError);
    expect(inMemoryUsersRepository.items[0].password).toBe(
      await fakeHasher.hash("current-password"),
    );
  });
});
