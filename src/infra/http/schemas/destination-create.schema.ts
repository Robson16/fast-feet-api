import { z } from "zod";

export const destinationCreateSchema = z.object({
  recipientId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  addressStreet: z.string().min(1, "Street is required"),
  addressNumber: z.string().min(1, "Number is required"),
  addressComplement: z.string().optional().default(""),
  addressZipCode: z.string().regex(/^\d{5}-\d{3}$/, "Invalid ZIP/CEP format"),
  addressNeighborhood: z.string().min(1, "Neighborhood is required"),
  addressCity: z.string().min(1, "City is required"),
  addressState: z.string().min(1, "State is required"),
  addressCountry: z.string().optional().default("Brazil"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type DestinationCreateSchema = z.infer<typeof destinationCreateSchema>;
