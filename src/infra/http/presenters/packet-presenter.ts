import { Packet } from "@/domain/order/enterprise/entities/packet";

export class PacketPresenter {
  static toHTTP(packet: Packet) {
    return {
      id: packet.id.toString(),
      destinationId: packet.destinationId.toString(),
      delivererId: packet.delivererId?.toString() ?? null,
      status: packet.status,
      createdAt: packet.createdAt,
      updatedAt: packet.updatedAt ?? null,
    };
  }
}
