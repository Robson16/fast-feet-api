import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const editProfileBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type EditProfileBodySchema = z.infer<typeof editProfileBodySchema>;

export const editProfileApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    properties: {
      name: { type: "string", example: "Jane Updated" },
      email: { type: "string", format: "email" },
    },
  },
};
