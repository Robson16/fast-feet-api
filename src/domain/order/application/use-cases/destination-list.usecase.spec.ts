import { destinationMaker } from "test/factories/destination/destination-maker";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";

import { DestinationListUseCase } from "./destination-list.usecase";

let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let sut: DestinationListUseCase; // Subject Under Test

describe("List Destinations", () => {
  beforeEach(() => {
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    sut = new DestinationListUseCase(inMemoryDestinationsRepository);
  });

  it("should be able to list destinations", async () => {
    // 1. Criamos os destinos em variáveis com datas diferentes
    const destination1 = destinationMaker({
      createdAt: new Date(2026, 0, 20),
    });
    const destination2 = destinationMaker({
      createdAt: new Date(2026, 0, 18),
    });
    const destination3 = destinationMaker({
      createdAt: new Date(2026, 0, 15),
    });

    await inMemoryDestinationsRepository.create(destination3);
    await inMemoryDestinationsRepository.create(destination1);
    await inMemoryDestinationsRepository.create(destination2);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.destinations).toHaveLength(3);
    expect(result.value?.destinations).toEqual([
      expect.objectContaining({ id: destination1.id }),
      expect.objectContaining({ id: destination2.id }),
      expect.objectContaining({ id: destination3.id }),
    ]);
  });

  it("should be able to fetch paginated destinations", async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryDestinationsRepository.create(destinationMaker());
    }

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.destinations).toHaveLength(2);
  });

  it("should return an empty array if there are no destinations", async () => {
    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.destinations).toHaveLength(0);
  });
});
