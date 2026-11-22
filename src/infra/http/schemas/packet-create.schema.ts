import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const packetCreateBodySchema = z.object({
  destinationId: z.string().uuid(),
});

export type PacketCreateBodySchema = z.infer<typeof packetCreateBodySchema>;

export const packetCreateApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["destinationId"],
    properties: {
      destinationId: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
    },
  },
};
