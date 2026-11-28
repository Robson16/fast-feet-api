import { z } from "zod";

export const packetListNearbyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    latitude: z.coerce.number().finite().min(-90).max(90),
    longitude: z.coerce.number().finite().min(-180).max(180),
    distance: z.coerce.number().finite().positive().default(5000),
  })
  .strict();

export type PacketListNearbyQuerySchema = z.infer<
  typeof packetListNearbyQuerySchema
>;
