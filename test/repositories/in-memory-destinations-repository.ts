import { PaginationParams } from "@/core/repositories/pagination-params";
import { DestinationsRepository } from "@/domain/order/application/repositories/destinations-repository";
import { Destination } from "@/domain/order/enterprise/entities/destination";

export class InMemoryDestinationsRepository implements DestinationsRepository {
  public items: Destination[] = [];

  async findById(id: string) {
    const destination = this.items.find((item) => item.id.toString() === id);

    if (!destination) {
      return null;
    }

    return destination;
  }

  async findMany({ page }: PaginationParams): Promise<Destination[]> {
    const startIndex = (page - 1) * 20;

    return [...this.items]
      .sort((first, second) => {
        const timeDifference =
          second.createdAt.getTime() - first.createdAt.getTime();

        if (timeDifference !== 0) {
          return timeDifference;
        }

        return first.id
          .toString()
          .toLowerCase()
          .localeCompare(second.id.toString().toLowerCase());
      })
      .slice(startIndex, startIndex + 20);
  }

  async create(destination: Destination) {
    this.items.push(destination);
  }

  async save(destination: Destination): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id === destination.id,
    );

    if (itemIndex !== -1) {
      this.items[itemIndex] = destination;
    }
  }

  async delete(destination: Destination) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === destination.id,
    );

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }
  }
}
