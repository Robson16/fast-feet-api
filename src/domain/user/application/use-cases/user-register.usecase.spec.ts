import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";

import { InvalidCPFError } from "./errors/invalid-cpf-error";
import { InvalidUserRole } from "./errors/invalid-user-role";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";
import { UserRegisterUseCase } from "./user-register.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: UserRegisterUseCase; // Subject Under Test

describe("Register User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    sut = new UserRegisterUseCase(inMemoryUsersRepository, fakeHasher);
  });

  it("should be able to register a user", async () => {
    const result = await sut.execute({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "DELIVERER",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      user: inMemoryUsersRepository.items[0],
    });
  });

  it("should hash user password upon registration", async () => {
    const result = await sut.execute({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "DELIVERER",
    });

    const hashedPassword = await fakeHasher.hash("123456");

    expect(result.isRight()).toBe(true);
    expect(inMemoryUsersRepository.items[0].password).toEqual(hashedPassword);
  });

  it("should not be able to register with an invalid CPF", async () => {
    const result = await sut.execute({
      name: "John Doe",
      cpf: "invalid-cfp-number",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "DELIVERER",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCPFError);
  });

  it("should not be able to register with CPF already in use", async () => {
    const user = makeUser({
      cpf: CPF.create("267.859.975-26"),
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "DELIVERER",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });

  it("should not be able to register with Email already in use", async () => {
    const user = makeUser({
      email: "jonhdoe@example.com",
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "DELIVERER",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });

  it("should not be able to register a user with an invalid role", async () => {
    const result = await sut.execute({
      name: "John Doe",
      cpf: "267.859.975-26",
      email: "jonhdoe@example.com",
      password: "123456",
      role: "INVALID-ROLE",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidUserRole);
  });
});
