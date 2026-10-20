import { PaginationParams } from "@/core/repositories/pagination-params";
import { getDistanceBetweenCoordinates } from "@/core/utils/get-distance-between-coodinates";
import {
  FindManyNearbyByStatusAndDelivererIdParams,
  PacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import {
  Packet,
  PacketStatus,
} from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

import { InMemoryDestinationsRepository } from "./in-memory-destinations-repository";
import { InMemoryUsersRepository } from "./in-memory-users-repository";

export class InMemoryPacketsRepository implements PacketsRepository {
  public items: Packet[] = [];

  constructor(
    private usersRepository: InMemoryUsersRepository,
    private destinationsRepository: InMemoryDestinationsRepository,
  ) {}

  async findById(id: string) {
    const packet = this.items.find((item) => item.id.toString() === id);

    if (!packet) {
      return null;
    }

    return packet;
  }

  async findDetailsById(id: string) {
    const packet = this.items.find((item) => item.id.toString() === id);

    if (!packet) {
      return null;
    }

    const destination = await this.destinationsRepository.findById(
      packet.destinationId.toString(),
    );

    if (!destination) {
      throw new Error(
        `Destination with ID "${packet.destinationId.toString()}" does not exist.`,
      );
    }

    const recipient = await this.usersRepository.findById(
      destination.recipientId.toString(),
    );

    if (!recipient) {
      throw new Error(
        `Recipient with ID "${destination.recipientId.toString()}" does not exist.`,
      );
    }

    return PacketDetails.create({
      packetId: packet.id,
      destinationId: packet.destinationId,
      recipient: recipient.name,
      addressStreet: destination.addressStreet,
      addressNumber: destination.addressNumber,
      addressComplement: destination.addressComplement,
      addressZipCode: destination.addressZipCode,
      addressNeighborhood: destination.addressNeighborhood,
      addressCity: destination.addressCity,
      addressState: destination.addressState,
      addressCountry: destination.addressCountry,
      status: packet.status,
      createdAt: packet.createdAt,
      updatedAt: packet.updatedAt,
    });
  }

  async findAwaitingWithdrawalById(id: string) {
    const packet = this.items.find(
      (item) =>
        item.id.toString() === id && item.status === "AWAITING_WITHDRAWAL",
    );

    if (!packet) {
      return null;
    }

    return packet;
  }

  async findManyByStatus(status: PacketStatus, { page }: PaginationParams) {
    const startIndex = (page - 1) * 20;
    const endIndex = page * 20;

    const packets = this.items
      .filter((item) => item.status === status)
      .slice(startIndex, endIndex);

    return packets;
  }

  async findManyByStatusAndDelivererId(
    status: PacketStatus,
    delivererId: string,
    { page }: PaginationParams,
    filters?: PacketsFilters,
  ) {
    const startIndex = (page - 1) * 20;
    const endIndex = page * 20;

    const packets = this.items.filter((item) => {
      const matchStatus = item.status === status;
      const matchDelivererId = item.delivererId?.toString() === delivererId;

      return matchStatus && matchDelivererId;
    });

    if (filters && (filters.neighborhood || filters.city || filters.state)) {
      const filteredPackets = await Promise.all(
        packets.map(async (packet) => {
          const destination = await this.destinationsRepository.findById(
            packet.destinationId.toString(),
          );

          return { packet, destination };
        }),
      );

      return filteredPackets
        .filter(({ destination }) =>
          destination
            ? (!filters.neighborhood ||
                destination.addressNeighborhood === filters.neighborhood) &&
              (!filters.city || destination.addressCity === filters.city) &&
              (!filters.state || destination.addressState === filters.state)
            : false,
        )
        .map(({ packet }) => packet)
        .slice(startIndex, endIndex);
    }

    return packets.slice(startIndex, endIndex);
  }

  async findManyNearbyByStatusAndDelivererId(
    params: FindManyNearbyByStatusAndDelivererIdParams,
  ): Promise<Packet[]> {
    const packets = this.items.filter((item) => {
      const matchStatus = item.status === params.status;
      const matchDelivererId =
        item.delivererId?.toString() === params.delivererId;

      return matchStatus && matchDelivererId;
    });

    const filteredPackets = await Promise.all(
      packets.map(async (packet) => {
        const destination = await this.destinationsRepository.findById(
          packet.destinationId.toString(),
        );

        if (!destination) {
          return null;
        }

        const distance = getDistanceBetweenCoordinates(
          {
            latitude: params.latitude,
            longitude: params.longitude,
          },
          {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        );

        if (distance <= params.distance) {
          return packet;
        }

        return null; // Explicitly returns null if the packet is not within distance
      }),
    );

    const startIndex = (params.pagination.page - 1) * 20;
    const endIndex = params.pagination.page * 20;

    return filteredPackets
      .filter((packet): packet is Packet => packet !== null)
      .slice(startIndex, endIndex);
  }

  async create(packet: Packet) {
    this.items.push(packet);
  }

  async save(packet: Packet) {
    const itemIndex = this.items.findIndex((item) => item.id === packet.id);

    if (itemIndex !== -1) {
      this.items[itemIndex] = packet;
    }
  }

  async delete(packet: Packet) {
    const itemIndex = this.items.findIndex((item) => item.id === packet.id);

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }
  }
}
