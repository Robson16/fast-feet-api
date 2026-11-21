import { z } from "zod";

export const packetListByRecipientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type PacketListByRecipientQuerySchema = z.infer<
  typeof packetListByRecipientQuerySchema
>;
