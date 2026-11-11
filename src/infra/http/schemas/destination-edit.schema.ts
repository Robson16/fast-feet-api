import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const destinationEditSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  addressStreet: z.string().min(1, "Street is required").optional(),
  addressNumber: z.string().min(1, "Number is required").optional(),
  addressComplement: z.string().optional(),
  addressZipCode: z
    .string()
    .regex(/^\d{5}-\d{3}$/, "Invalid ZIP/CEP format")
    .optional(),
  addressNeighborhood: z.string().min(1, "Neighborhood is required").optional(),
  addressCity: z.string().min(1, "City is required").optional(),
  addressState: z.string().min(1, "State is required").optional(),
  addressCountry: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type DestinationEditSchema = z.infer<typeof destinationEditSchema>;

export const editDestinationApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    properties: {
      title: { type: "string", example: "Home Office" },
      addressStreet: { type: "string", example: "Main Street" },
      addressNumber: { type: "string", example: "456" },
      addressComplement: { type: "string", example: "Suite 101" },
      addressZipCode: { type: "string", example: "10001-123" },
      addressNeighborhood: { type: "string", example: "Downtown" },
      addressCity: { type: "string", example: "Metropolis" },
      addressState: { type: "string", example: "NY" },
      addressCountry: { type: "string", example: "USA" },
      latitude: { type: "number", example: 40.7128 },
      longitude: { type: "number", example: -74.006 },
    },
  },
};
