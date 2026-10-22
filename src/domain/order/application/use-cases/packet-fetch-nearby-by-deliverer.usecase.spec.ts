import { makeDestination } from "test/factories/make-destination";
import { makePacket } from "test/factories/make-packet";
import { makeUser } from "test/factories/make-user";
import { InMemoryDestinationsRepository } from "test/repositories/in-memory-destinations-repository";
import { InMemoryPacketsRepository } from "test/repositories/in-memory-packets-repository";
import { InMemoryUsersRepository } from "test/repositories/in-memory-users-repository";

import { PacketFetchNearbyByDelivererUseCase } from "./packet-fetch-nearby-by-deliverer.usecase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryDestinationsRepository: InMemoryDestinationsRepository;
let inMemoryPacketsRepository: InMemoryPacketsRepository;
let sut: PacketFetchNearbyByDelivererUseCase;

describe("Fetch Packets Nearby By Deliverer", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryDestinationsRepository = new InMemoryDestinationsRepository();
    inMemoryPacketsRepository = new InMemoryPacketsRepository(
      inMemoryUsersRepository,
      inMemoryDestinationsRepository,
    );
    sut = new PacketFetchNearbyByDelivererUseCase(inMemoryPacketsRepository);
  });

  it("should be able to fetch packets nearby by deliverer id", async () => {
    const deliverer = makeUser();

    await inMemoryUsersRepository.create(deliverer);

    const destination1 = makeDestination({
      latitude: -23.543230904067464,
      longitude: -46.63861674486173,
    });
    const destination2 = makeDestination({
      latitude: -23.54501135408347,
      longitude: -46.638677436319895,
    });
    const destination3 = makeDestination({
      latitude: -23.543230904067464,
      longitude: -46.634034539770255,
    });
    const destination4 = makeDestination({
      latitude: -23.514073962096976,
      longitude: -46.64337372730712,
    });
    const destination5 = makeDestination({
      latitude: -23.70443954074078,
      longitude: -46.69842914846108,
    });

    await inMemoryDestinationsRepository.create(destination1);
    await inMemoryDestinationsRepository.create(destination2);
    await inMemoryDestinationsRepository.create(destination3);
    await inMemoryDestinationsRepository.create(destination4);
    await inMemoryDestinationsRepository.create(destination5);

    const packet1 = makePacket({
      delivererId: deliverer.id,
      destinationId: destination1.id,
      status: "WITHDRAWN",
    });
    const packet2 = makePacket({
      delivererId: deliverer.id,
      destinationId: destination2.id,
      status: "WITHDRAWN",
    });
    const packet3 = makePacket({
      delivererId: deliverer.id,
      destinationId: destination3.id,
      status: "WITHDRAWN",
    });
    const packet4 = makePacket({
      delivererId: deliverer.id,
      destinationId: destination4.id,
      status: "WITHDRAWN",
    });
    const packet5 = makePacket({
      delivererId: deliverer.id,
      destinationId: destination5.id,
      status: "WITHDRAWN",
    });

    await inMemoryPacketsRepository.create(packet1);
    await inMemoryPacketsRepository.create(packet2);
    await inMemoryPacketsRepository.create(packet3);
    await inMemoryPacketsRepository.create(packet4);
    await inMemoryPacketsRepository.create(packet5);

    const result = await sut.execute({
      delivererId: deliverer.id.toString(),
      distance: 500,
      latitude: -23.54288315710968,
      longitude: -46.6364015066387,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.packets).toHaveLength(3);
  });
});
