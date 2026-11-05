import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserFactory } from "test/factories/user/user-factory";
import { userMaker } from "test/factories/user/user-maker";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { DatabaseModule } from "@/infra/database/database.module";

describe("PrismaUsersRepository (E2E)", () => {
  let app: INestApplication;
  let usersRepository: UsersRepository;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    usersRepository = moduleRef.get(UsersRepository);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("creates a user and finds it by ID, CPF, and email", async () => {
    const user = userMaker();

    await usersRepository.create(user);

    const [userById, userByCPF, userByEmail] = await Promise.all([
      usersRepository.findById(user.id.toString()),
      usersRepository.findByCPF(user.cpf.value),
      usersRepository.findByEmail(user.email),
    ]);

    expect(userById?.id.toString()).toBe(user.id.toString());
    expect(userByCPF?.id.toString()).toBe(user.id.toString());
    expect(userByEmail?.id.toString()).toBe(user.id.toString());
  });

  test("updates and deletes a user", async () => {
    const user = await userFactory.makePrismaUser();

    user.name = "Updated User";
    await usersRepository.save(user);

    const updatedUser = await usersRepository.findById(user.id.toString());
    expect(updatedUser?.name).toBe("Updated User");

    await usersRepository.delete(user);

    const deletedUser = await usersRepository.findById(user.id.toString());
    expect(deletedUser).toBeNull();
  });

  test("returns null when the user does not exist", async () => {
    const user = await usersRepository.findById(
      new UniqueEntityID().toString(),
    );

    expect(user).toBeNull();
  });
});
