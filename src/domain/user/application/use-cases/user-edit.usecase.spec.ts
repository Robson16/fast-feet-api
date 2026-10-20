import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

import { InvalidCPFError } from "./errors/invalid-cpf-error";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";
import { EditUserUseCase } from "./user-edit.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: EditUserUseCase; // Subject Under Test

describe("Edit User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    sut = new EditUserUseCase(inMemoryUsersRepository, fakeHasher);
  });

  it("should be able to edit a user", async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      name: "John Doe",
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items[0]).toMatchObject({
      name: "John Doe",
    });
  });

  it("should not be able to edit a nonexistent user", async () => {
    const result = await sut.execute({
      userId: "invalid-user-id",
      name: "Non Existent User",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to edit a user with an invalid CPF number", async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      cpf: "invalid-cpf-number",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCPFError);
  });

  it("should not be able to edit a user for a CPF number already in use", async () => {
    const user1 = makeUser();
    const user2 = makeUser();

    await inMemoryUsersRepository.create(user1);
    await inMemoryUsersRepository.create(user2);

    const result = await sut.execute({
      userId: user1.id.toString(),
      cpf: user2.cpf.value,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });

  it("should not be able to edit a user in an email already in use", async () => {
    const user1 = makeUser();
    const user2 = makeUser();

    await inMemoryUsersRepository.create(user1);
    await inMemoryUsersRepository.create(user2);

    const result = await sut.execute({
      userId: user1.id.toString(),
      email: user2.email,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });
});
