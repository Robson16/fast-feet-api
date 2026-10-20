import { faker } from "@faker-js/faker";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Destination,
  DestinationProps,
} from "@/domain/order/enterprise/entities/destination";

export function makeDestination(
  override: Partial<DestinationProps> = {},
  id?: UniqueEntityID,
): Destination {
  const destination = Destination.create(
    {
      recipientId: new UniqueEntityID(),
      title: faker.lorem.word(),
      addressStreet: faker.location.street(),
      addressNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
      addressComplement: faker.location.secondaryAddress(),
      addressZipCode: faker.location.zipCode(),
      addressNeighborhood: faker.location.county(),
      addressCity: faker.location.city(),
      addressState: faker.location.state(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      ...override,
    },
    id,
  );

  return destination;
}
