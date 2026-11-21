import { z } from "zod";

export const destinationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type DestinationListQuerySchema = z.infer<
  typeof destinationListQuerySchema
>;
