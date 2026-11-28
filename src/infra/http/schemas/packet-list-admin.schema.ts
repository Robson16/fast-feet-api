import { z } from "zod";

import { packetAddressFiltersShape } from "./packet-address-filters.schema";

export const packetListAdminQuerySchema = z
  .object({
    ...packetAddressFiltersShape,
    status: z
      .enum(["AWAITING_WITHDRAWAL", "WITHDRAWN", "DELIVERED", "RETURNED"])
      .optional(),
    delivererId: z.string().uuid().optional(),
    recipientId: z.string().uuid().optional(),
  })
  .strict();

export type PacketListAdminQuerySchema = z.infer<
  typeof packetListAdminQuerySchema
>;
