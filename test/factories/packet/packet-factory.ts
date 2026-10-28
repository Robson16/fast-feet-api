import { Injectable } from "@nestjs/common";

import { Packet, PacketProps } from "@/domain/order/enterprise/entities/packet";
import { PrismaPacketMapper } from "@/infra/database/prisma/mappers/prisma-packet-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";

import { packetMaker } from "./packet-maker";

@Injectable()
export class PacketFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaPacket(data: Partial<PacketProps> = {}): Promise<Packet> {
    const packet = packetMaker(data);

    await this.prisma.packet.create({
      data: PrismaPacketMapper.toPrisma(packet),
    });

    return packet;
  }
}
