import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DestinationFactory } from "test/factories/destination/destination-factory";
import { packetMaker } from "test/factories/packet/packet-maker";
import { UserFactory } from "test/factories/user/user-factory";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { PacketsRepository } from "@/domain/order/application/repositories/packets-repository";
import { Role } from "@/domain/user/enterprise/entities/value-objects/role";
import { DatabaseModule } from "@/infra/database/database.module";

describe("PrismaPacketsRepository (E2E)", () => {
  let app: INestApplication;
  let packetsRepository: PacketsRepository;
  let destinationFactory: DestinationFactory;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [DestinationFactory, UserFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    packetsRepository = moduleRef.get(PacketsRepository);
    destinationFactory = moduleRef.get(DestinationFactory);
    userFactory = moduleRef.get(UserFactory);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test("creates and finds a packet by ID and awaiting status", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = packetMaker({
      destinationId: destination.id,
      delivererId: deliverer.id,
    });

    await packetsRepository.create(packet);

    const packetById = await packetsRepository.findById(packet.id.toString());
    const awaitingPacket = await packetsRepository.findAwaitingWithdrawalById(
      packet.id.toString(),
    );

    expect(packetById?.id.toString()).toBe(packet.id.toString());
    expect(awaitingPacket?.status).toBe("AWAITING_WITHDRAWAL");
  });

  test("filters by state when city and neighborhood are omitted", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destinationInStateA = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "STATE-A",
    });
    const destinationInStateB = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressState: "STATE-B",
    });
    const matchingPacket = packetMaker({
      destinationId: destinationInStateA.id,
      delivererId: deliverer.id,
      status: "AWAITING_WITHDRAWAL",
    });
    const nonMatchingPacket = packetMaker({
      destinationId: destinationInStateB.id,
      delivererId: deliverer.id,
      status: "AWAITING_WITHDRAWAL",
    });

    await packetsRepository.create(matchingPacket);
    await packetsRepository.create(nonMatchingPacket);

    const packets = await packetsRepository.findManyByStatusAndDelivererId(
      "AWAITING_WITHDRAWAL",
      deliverer.id.toString(),
      { page: 1 },
      { state: "state-a" },
    );

    expect(packets.map((packet) => packet.id.toString())).toEqual([
      matchingPacket.id.toString(),
    ]);
  });

  test("returns null when the packet does not exist", async () => {
    const packet = await packetsRepository.findById(
      new UniqueEntityID().toString(),
    );

    expect(packet).toBeNull();
  });

  test("rejects a packet with a destination that does not exist", async () => {
    const packet = packetMaker({
      destinationId: new UniqueEntityID(),
    });

    await expect(packetsRepository.create(packet)).rejects.toThrow();
  });

  test("finds packet details by ID including relations and numeric coordinates", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
      name: "John Doe",
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      latitude: -23.1857,
      longitude: -46.8978,
    });
    const packet = packetMaker({ destinationId: destination.id });
    await packetsRepository.create(packet);

    const details = await packetsRepository.findDetailsById(
      packet.id.toString(),
    );

    expect(details).toBeTruthy();
    expect(details?.recipient).toBe("John Doe");
    expect(details?.addressCity).toBe(destination.addressCity);
    expect(details?.latitude).toBe(-23.1857);
    expect(details?.longitude).toBe(-46.8978);
  });

  test("finds many nearby packets by status and deliverer id", async () => {
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });

    // Destination within range
    const nearbyDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      latitude: -23.1857,
      longitude: -46.8978,
    });
    // Destination outside range
    const farDestination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      latitude: -23.0,
      longitude: -46.7,
    });

    const nearbyPacket = packetMaker({
      destinationId: nearbyDestination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });
    const farPacket = packetMaker({
      destinationId: farDestination.id,
      delivererId: deliverer.id,
      status: "WITHDRAWN",
    });

    await packetsRepository.create(nearbyPacket);
    await packetsRepository.create(farPacket);

    const packets =
      await packetsRepository.findManyNearbyByStatusAndDelivererId({
        delivererId: deliverer.id.toString(),
        status: "WITHDRAWN",
        latitude: -23.186,
        longitude: -46.898,
        distance: 5000, // 5 km expressed in meters
        pagination: { page: 1 },
      });

    expect(packets).toHaveLength(1);
    expect(packets[0].id.toString()).toBe(nearbyPacket.id.toString());
  });

  test("paginates when finding many by recipient ID", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    for (let i = 0; i < 22; i++) {
      await packetsRepository.create(
        packetMaker({ destinationId: destination.id }),
      );
    }

    const otherRecipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const otherDestination = await destinationFactory.makePrismaDestination({
      recipientId: otherRecipient.id,
    });
    await packetsRepository.create(
      packetMaker({ destinationId: otherDestination.id }),
    );

    const page1 = await packetsRepository.findManyByRecipientId(
      recipient.id.toString(),
      { page: 1 },
    );
    const page2 = await packetsRepository.findManyByRecipientId(
      recipient.id.toString(),
      { page: 2 },
    );

    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(2);
    expect(
      [...page1, ...page2].every(
        (packet) =>
          packet.destinationId.toString() === destination.id.toString(),
      ),
    ).toBe(true);
  });

  test("finds many by status", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const returnedPacket = packetMaker({
      destinationId: destination.id,
      status: "RETURNED",
    });
    const deliveredPacket = packetMaker({
      destinationId: destination.id,
      status: "DELIVERED",
    });
    await packetsRepository.create(returnedPacket);
    await packetsRepository.create(deliveredPacket);

    const packets = await packetsRepository.findManyByStatus("RETURNED", {
      page: 1,
    });

    expect(packets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: returnedPacket.id,
        }),
      ]),
    );
    expect(packets.map((packet) => packet.id.toString())).not.toContain(
      deliveredPacket.id.toString(),
    );
  });

  test("updates and deletes a packet", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = packetMaker({
      destinationId: destination.id,
      status: "AWAITING_WITHDRAWAL",
    });

    await packetsRepository.create(packet);

    packet.status = "WITHDRAWN";
    await packetsRepository.save(packet);

    const updatedPacket = await packetsRepository.findById(
      packet.id.toString(),
    );
    expect(updatedPacket?.status).toBe("WITHDRAWN");

    await packetsRepository.delete(packet);
    const deletedPacket = await packetsRepository.findById(
      packet.id.toString(),
    );
    expect(deletedPacket).toBeNull();
  });

  test("rejects updates and deletes for a packet that does not exist", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const packet = packetMaker({ destinationId: destination.id });

    await expect(packetsRepository.save(packet)).rejects.toThrow();
    await expect(packetsRepository.delete(packet)).rejects.toThrow();
  });

  test("returns an empty array when pagination exceeds the limit", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    for (let i = 0; i < 5; i++) {
      await packetsRepository.create(
        packetMaker({
          destinationId: destination.id,
          delivererId: deliverer.id,
          status: "DELIVERED",
        }),
      );
    }

    const page2 = await packetsRepository.findManyByStatusAndDelivererId(
      "DELIVERED",
      deliverer.id.toString(),
      { page: 2 },
    );

    expect(page2).toHaveLength(0);
    expect(page2).toEqual([]);
  });

  test("creates, finds, and correctly maps a packet without a deliverer", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    const packetWithoutDeliverer = packetMaker({
      destinationId: destination.id,
      delivererId: undefined,
      status: "AWAITING_WITHDRAWAL",
    });

    await packetsRepository.create(packetWithoutDeliverer);

    const foundPacket = await packetsRepository.findById(
      packetWithoutDeliverer.id.toString(),
    );
    const awaitingPacket = await packetsRepository.findAwaitingWithdrawalById(
      packetWithoutDeliverer.id.toString(),
    );

    expect(foundPacket).toBeTruthy();
    expect(foundPacket?.delivererId).toBeUndefined();

    expect(awaitingPacket).toBeTruthy();
    expect(awaitingPacket?.delivererId).toBeUndefined();
  });

  test("filters by city and neighborhood case-insensitively", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });

    const destinationInCityA = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressCity: "Example City A",
      addressNeighborhood: "North District",
    });
    const destinationInCityB = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
      addressCity: "Example City B",
      addressNeighborhood: "Central District",
    });

    const packetInCityA = packetMaker({
      destinationId: destinationInCityA.id,
      delivererId: deliverer.id,
      status: "AWAITING_WITHDRAWAL",
    });
    const packetInCityB = packetMaker({
      destinationId: destinationInCityB.id,
      delivererId: deliverer.id,
      status: "AWAITING_WITHDRAWAL",
    });

    await packetsRepository.create(packetInCityA);
    await packetsRepository.create(packetInCityB);

    const cityResult = await packetsRepository.findManyByStatusAndDelivererId(
      "AWAITING_WITHDRAWAL",
      deliverer.id.toString(),
      { page: 1 },
      { city: "example city a" },
    );
    expect(cityResult).toHaveLength(1);
    expect(cityResult[0].id.toString()).toBe(packetInCityA.id.toString());

    const neighborhoodResult =
      await packetsRepository.findManyByStatusAndDelivererId(
        "AWAITING_WITHDRAWAL",
        deliverer.id.toString(),
        { page: 1 },
        { neighborhood: "central district" },
      );
    expect(neighborhoodResult).toHaveLength(1);
    expect(neighborhoodResult[0].id.toString()).toBe(
      packetInCityB.id.toString(),
    );
  });

  test("returns null for non-existent details or awaiting withdrawal packet not in correct status", async () => {
    const fakeId = new UniqueEntityID().toString();
    expect(await packetsRepository.findDetailsById(fakeId)).toBeNull();
    expect(
      await packetsRepository.findAwaitingWithdrawalById(fakeId),
    ).toBeNull();

    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });
    const deliveredPacket = packetMaker({
      destinationId: destination.id,
      status: "DELIVERED",
    });

    await packetsRepository.create(deliveredPacket);

    // The packet exists, but its status is not AWAITING_WITHDRAWAL.
    expect(
      await packetsRepository.findAwaitingWithdrawalById(
        deliveredPacket.id.toString(),
      ),
    ).toBeNull();
  });

  test("isolates correctly by status and deliverer, and paginates findManyByStatus", async () => {
    const recipient = await userFactory.makePrismaUser({
      role: Role.create("RECIPIENT"),
    });
    const deliverer1 = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const deliverer2 = await userFactory.makePrismaUser({
      role: Role.create("DELIVERER"),
    });
    const destination = await destinationFactory.makePrismaDestination({
      recipientId: recipient.id,
    });

    await packetsRepository.create(
      packetMaker({
        destinationId: destination.id,
        delivererId: deliverer1.id,
        status: "WITHDRAWN",
      }),
    );
    await packetsRepository.create(
      packetMaker({
        destinationId: destination.id,
        delivererId: deliverer1.id,
        status: "DELIVERED",
      }),
    );
    await packetsRepository.create(
      packetMaker({
        destinationId: destination.id,
        delivererId: deliverer2.id,
        status: "WITHDRAWN",
      }),
    );

    const result = await packetsRepository.findManyByStatusAndDelivererId(
      "WITHDRAWN",
      deliverer1.id.toString(),
      { page: 1 },
    );
    expect(result).toHaveLength(1);
    expect(result[0].delivererId?.toString()).toBe(deliverer1.id.toString());
    expect(result[0].status).toBe("WITHDRAWN");

    // Set up and verify findManyByStatus pagination.
    for (let i = 0; i < 21; i++) {
      await packetsRepository.create(
        packetMaker({ destinationId: destination.id, status: "RETURNED" }),
      );
    }
    const page1 = await packetsRepository.findManyByStatus("RETURNED", {
      page: 1,
    });
    const page2 = await packetsRepository.findManyByStatus("RETURNED", {
      page: 2,
    });
    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(1);
  });
});
