import { makeDestination } from "test/factories/make-destination";
import { makePacket } from "test/factories/make-packet";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";

import { FetchPacketsWithdrawnByDelivererUseCase } from "./packet-fetch-withdrawn-by-deliverer.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: FetchPacketsWithdrawnByDelivererUseCase; // Subject Under Test

describe("Fetch Packets Withdrawn by Deliverer", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new FetchPacketsWithdrawnByDelivererUseCase(
      inMemoryPacketsRepository,
    );
  });

  it("should be able to fetch packets withdrawn by deliverer", async () => {
    const delivererId = new UniqueEntityID();

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        status: "WITHDRAWN",
      }),
    );

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        status: "WITHDRAWN",
      }),
    );

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        status: "WITHDRAWN",
      }),
    );

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
  });

  it("should be able to fetch packets withdrawn by deliverer and filtered by neighborhood", async () => {
    const delivererId = new UniqueEntityID();

    const destination1 = makeDestination();
    const destination2 = makeDestination();

    await inMemoryDestinationsRepository.create(destination1);
    await inMemoryDestinationsRepository.create(destination2);

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        destinationId: destination1.id,
        status: "WITHDRAWN",
      }),
    );

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        destinationId: destination1.id,
        status: "WITHDRAWN",
      }),
    );

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        destinationId: destination2.id,
        status: "WITHDRAWN",
      }),
    );

    await inMemoryPacketsRepository.create(
      makePacket({
        delivererId,
        destinationId: destination2.id,
        status: "WITHDRAWN",
      }),
    );

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 1,
      filters: {
        neighborhood: destination1.addressNeighborhood,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(2);
    expect(result.value?.packets).toMatchObject([
      { destinationId: destination1.id },
      { destinationId: destination1.id },
    ]);
  });

  it("should be able to fetch paginated packets withdrawn by deliverer", async () => {
    const delivererId = new UniqueEntityID();

    for (let i = 1; i <= 22; i++) {
      await inMemoryPacketsRepository.create(
        makePacket({
          delivererId,
          status: "WITHDRAWN",
        }),
      );
    }

    const result = await sut.execute({
      delivererId: delivererId.toString(),
      page: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(2);
  });
});
