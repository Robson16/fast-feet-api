import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Packet, PacketProps } from "@/domain/order/enterprise/entities/packet";

export function packetMaker(
  override: Partial<PacketProps> = {},
  id?: UniqueEntityID,
): Packet {
  const packet = Packet.create(
    {
      destinationId: new UniqueEntityID(),
      status: "AWAITING_WITHDRAWAL",
      ...override,
    },
    id,
  );

  return packet;
}
