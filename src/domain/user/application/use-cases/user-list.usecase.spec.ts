import { makeUser } from "test/factories/user/make-user";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { UserListUseCase } from "./user-list.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: UserListUseCase;

describe("List Users Use Case", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new UserListUseCase(inMemoryUsersRepository);
  });

  it("should return users from the requested page", async () => {
    const users = Array.from({ length: 21 }, () => makeUser());

    for (const user of users) {
      await inMemoryUsersRepository.create(user);
    }

    const result = await sut.execute({ page: 2 });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({ users: [users[0]] });
  });
});
