import { FakeEncrypter } from "test/cryptography/fake-encrypter";
import { FakeHasher } from "test/cryptography/fake-hasher";
import { makeUser } from "test/factories/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { CPF } from "@/domain/user/enterprise/entities/value-objects/cpf";

import { UserAuthenticateUseCase } from "./user-authenticate.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let fakeEncrypter: FakeEncrypter;
let sut: UserAuthenticateUseCase; // Subject Under Test

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    fakeEncrypter = new FakeEncrypter();
    sut = new UserAuthenticateUseCase(
      inMemoryUsersRepository,
      fakeHasher,
      fakeEncrypter,
    );
  });

  it("should be able to authenticate a user", async () => {
    const user = makeUser({
      cpf: CPF.create("267.859.975-26"),
      password: await fakeHasher.hash("123456"),
    });

    inMemoryUsersRepository.items.push(user);

    const result = await sut.execute({
      cpf: "267.859.975-26",
      password: "123456",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    });
  });
});
