import { PacketDetails } from "@/domain/order/enterprise/entities/value-objects/packet-details";

export class PacketDetailsPresenter {
  static toHTTP(packet: PacketDetails) {
    return {
      id: packet.packetId.toString(),
      destinationId: packet.destinationId.toString(),
      recipientId: packet.recipientId.toString(),
      recipient: packet.recipient,
      delivererId: packet.delivererId?.toString() ?? null,
      status: packet.status,
      addressStreet: packet.addressStreet,
      addressNumber: packet.addressNumber,
      addressComplement: packet.addressComplement,
      addressZipCode: packet.addressZipCode,
      addressNeighborhood: packet.addressNeighborhood,
      addressCity: packet.addressCity,
      addressState: packet.addressState,
      addressCountry: packet.addressCountry ?? null,
      latitude: packet.latitude,
      longitude: packet.longitude,
      createdAt: packet.createdAt,
      updatedAt: packet.updatedAt ?? null,
    };
  }
}
