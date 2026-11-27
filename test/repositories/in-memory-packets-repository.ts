import {
  DEFAULT_PER_PAGE,
  PaginationParams,
} from "@/core/repositories/pagination-params";
import { getDistanceBetweenCoordinates } from "@/core/utils/get-distance-between-coordinates";
import {
  FindManyNearbyPacketsParams,
  FindManyPacketsFilters,
  PacketsRepository,
} from "@/domain/order/application/repositories/packets-repository";
import { Packet } from "@/domain/order/enterprise/entities/packet";
import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

import { InMemoryDestinationsRepository } from "./in-memory-destinations-repository";
import { InMemoryUsersRepository } from "./in-memory-users-repository";

export class InMemoryPacketsRepository implements PacketsRepository {
  public items: Packet[] = [];

  constructor(
    private usersRepository: InMemoryUsersRepository,
    private destinationsRepository: InMemoryDestinationsRepository,
  ) {}

  private sortPackets(packets: Packet[]): Packet[] {
    return [...packets].sort((first, second) => {
      const timeDifference =
        second.createdAt.getTime() - first.createdAt.getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return first.id
        .toString()
        .toLowerCase()
        .localeCompare(second.id.toString().toLowerCase());
    });
  }

  private paginatePackets(packets: Packet[], page: number): Packet[] {
    const startIndex = (page - 1) * DEFAULT_PER_PAGE;

    return this.sortPackets(packets).slice(
      startIndex,
      startIndex + DEFAULT_PER_PAGE,
    );
  }

  private async filterByDestination(
    packets: Packet[],
    filters?: FindManyPacketsFilters,
  ): Promise<Packet[]> {
    const hasDestinationFilter =
      filters?.recipientId ||
      filters?.neighborhood ||
      filters?.city ||
      filters?.state;

    if (!hasDestinationFilter) {
      return packets;
    }

    const normalizedNeighborhood = filters.neighborhood?.toLowerCase();
    const normalizedCity = filters.city?.toLowerCase();
    const normalizedState = filters.state?.toLowerCase();

    const packetsWithDestinations = await Promise.all(
      packets.map(async (packet) => ({
        packet,
        destination: await this.destinationsRepository.findById(
          packet.destinationId.toString(),
        ),
      })),
    );

    return packetsWithDestinations
      .filter(({ destination }) => {
        if (!destination) {
          return false;
        }

        const matchRecipient =
          !filters.recipientId ||
          destination.recipientId.toString() === filters.recipientId;
        const matchNeighborhood =
          !normalizedNeighborhood ||
          destination.addressNeighborhood
            .toLowerCase()
            .includes(normalizedNeighborhood);
        const matchCity =
          !normalizedCity ||
          destination.addressCity.toLowerCase().includes(normalizedCity);
        const matchState =
          !normalizedState ||
          destination.addressState.toLowerCase().includes(normalizedState);

        return matchRecipient && matchNeighborhood && matchCity && matchState;
      })
      .map(({ packet }) => packet);
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async findDetailsById(id: string) {
    const packet = await this.findById(id);

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
      recipientId: destination.recipientId,
      delivererId: packet.delivererId,
      recipient: recipient.name,
      addressStreet: destination.addressStreet,
      addressNumber: destination.addressNumber,
      addressComplement: destination.addressComplement,
      addressZipCode: destination.addressZipCode,
      addressNeighborhood: destination.addressNeighborhood,
      addressCity: destination.addressCity,
      addressState: destination.addressState,
      addressCountry: destination.addressCountry,
      latitude: destination.latitude,
      longitude: destination.longitude,
      status: packet.status,
      deliveryPhotoKey: packet.deliveryPhotoKey,
      deliveryPhotoMimeType: packet.deliveryPhotoMimeType,
      deliveryPhotoSize: packet.deliveryPhotoSize,
      deliveryPhotoUploadedAt: packet.deliveryPhotoUploadedAt,
      createdAt: packet.createdAt,
      updatedAt: packet.updatedAt,
    });
  }

  async findAwaitingWithdrawalById(id: string) {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id && item.status === "AWAITING_WITHDRAWAL",
      ) ?? null
    );
  }

  async findMany(
    { page }: PaginationParams,
    filters?: FindManyPacketsFilters,
  ): Promise<Packet[]> {
    const matchedPackets = this.items.filter((item) => {
      const matchStatus = !filters?.status || item.status === filters.status;
      const matchDeliverer =
        !filters?.delivererId ||
        item.delivererId?.toString() === filters.delivererId;

      return matchStatus && matchDeliverer;
    });

    const filteredPackets = await this.filterByDestination(
      matchedPackets,
      filters,
    );

    return this.paginatePackets(filteredPackets, page);
  }

  async findManyNearby(params: FindManyNearbyPacketsParams): Promise<Packet[]> {
    const packets = this.items.filter(
      (item) =>
        item.status === params.status &&
        item.delivererId?.toString() === params.delivererId,
    );

    const filteredPackets = await Promise.all(
      packets.map(async (packet) => {
        const destination = await this.destinationsRepository.findById(
          packet.destinationId.toString(),
        );

        if (!destination) {
          return null;
        }

        const distance = getDistanceBetweenCoordinates(
          { latitude: params.latitude, longitude: params.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        );

        return distance <= params.distance ? packet : null;
      }),
    );

    const validPackets = filteredPackets.filter(
      (packet): packet is Packet => packet !== null,
    );

    return this.paginatePackets(validPackets, params.page);
  }

  async create(packet: Packet) {
    this.items.push(packet);
  }

  async save(packet: Packet) {
    const itemIndex = this.items.findIndex((item) => item.id.equals(packet.id));

    if (itemIndex !== -1) {
      this.items[itemIndex] = packet;
    }
  }

  async delete(packet: Packet) {
    const itemIndex = this.items.findIndex((item) => item.id.equals(packet.id));

    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }
  }
}
