import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { UpdateUserPasswordUseCase } from "./user-update-password.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: UpdateUserPasswordUseCase; // Subject Under Test

describe("Update User Password", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    sut = new UpdateUserPasswordUseCase(inMemoryUsersRepository, fakeHasher);
  });

  it("should be able to update a user password", async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      password: "654321",
    });

    const hashedPassword = await fakeHasher.hash("654321");

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items[0].password).toEqual(hashedPassword);
  });

  it("should not be able to update the password for a nonexistent user", async () => {
    const result = await sut.execute({
      userId: "invalid-user-id",
      password: "654321",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
