import { userMaker } from "test/factories/user/user-maker";
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
    const baseDate = new Date();

    const users = Array.from({ length: 21 }, (_, index) =>
      userMaker({
        // Creates a new date by adding 'index' seconds (index * 1000 ms) to the base.
        createdAt: new Date(baseDate.getTime() + index * 1000),
      }),
    );

    for (const user of users) {
      await inMemoryUsersRepository.create(user);
    }

    const result = await sut.execute({ page: 2 });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({ users: [users[0]] });
  });
});
