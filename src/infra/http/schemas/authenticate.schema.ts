import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const authenticateBodySchema = z.object({
  cpf: z.string(),
  password: z.string(),
});

export type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;

export const authenticateApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["cpf", "password"],
    properties: {
      cpf: { type: "string", example: "111.222.333-44" },
      password: { type: "string", example: "strong-password" },
    },
  },
};
