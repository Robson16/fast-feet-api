import { UsersRepository } from "@/domain/user/application/repositories/users-repository";
import { User } from "@/domain/user/enterprise/entities/user";

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findById(id: string) {
    const user = this.items.find((item) => item.id.toString() === id);

    if (!user) {
      return null;
    }

    return user;
  }

  async findMany({ page }: { page: number }) {
    const startIndex = (page - 1) * 20;

    return [...this.items]
      .sort(
        (first, second) =>
          second.createdAt.getTime() - first.createdAt.getTime(),
      )
      .slice(startIndex, startIndex + 20);
  }

  async findByCPF(cpf: string) {
    const user = this.items.find((item) => item.cpf.value === cpf);

    if (!user) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = this.items.find((item) => item.email === email);

    if (!user) {
      return null;
    }

    return user;
  }

  async create(user: User) {
    this.items.push(user);
  }

  async save(user: User) {
    const itemIndex = this.items.findIndex((item) => item.id === user.id);

    if (itemIndex !== -1) {
      this.items[itemIndex] = user;
    }
  }

  async delete(user: User) {
    const itemIndex = this.items.findIndex((item) => item.id === user.id);

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }
  }
}
