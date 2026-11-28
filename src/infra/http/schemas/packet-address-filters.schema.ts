import { z } from "zod";

export const packetAddressFiltersShape = {
  page: z.coerce.number().int().min(1).default(1),
  state: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  neighborhood: z.string().trim().min(1).optional(),
};

export const packetAddressFiltersQuerySchema = z
  .object(packetAddressFiltersShape)
  .strict();

export type PacketAddressFiltersQuerySchema = z.infer<
  typeof packetAddressFiltersQuerySchema
>;
