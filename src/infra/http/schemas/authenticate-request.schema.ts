import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const userAuthenticateBodySchema = z.object({
  cpf: z.string(),
  password: z.string(),
});

export type UserAuthenticateBodySchema = z.infer<
  typeof userAuthenticateBodySchema
>;

export const userAuthenticateApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["cpf", "password"],
    properties: {
      cpf: { type: "string", example: "111.222.333-44" },
      password: { type: "string", example: "strong-password" },
    },
  },
};
