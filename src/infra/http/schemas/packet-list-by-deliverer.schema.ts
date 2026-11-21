import { z } from "zod";

export const packetListByDelivererQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type PacketListByDelivererQuerySchema = z.infer<
  typeof packetListByDelivererQuerySchema
>;
