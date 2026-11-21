import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const profileEditBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type ProfileEditBodySchema = z.infer<typeof profileEditBodySchema>;

export const profileEditApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    properties: {
      name: { type: "string", example: "Jane Updated" },
      email: { type: "string", format: "email" },
    },
  },
};
