import { z } from "zod";

export const destinationCreateSchema = z.object({
  recipientId: z.string().uuid(),
  title: z.string(),
  addressStreet: z.string(),
  addressNumber: z.string(),
  addressComplement: z.string().optional().default(""),
  addressZipCode: z.string(),
  addressNeighborhood: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressCountry: z.string().optional().default("Brazil"),
  latitude: z.number(),
  longitude: z.number(),
});

export type DestinationCreateSchema = z.infer<typeof destinationCreateSchema>;
