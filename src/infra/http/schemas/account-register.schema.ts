import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const accountRegisterBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export type AccountRegisterBodySchema = z.infer<
  typeof accountRegisterBodySchema
>;

export const accountRegisterApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["name", "cpf", "email", "password"],
    properties: {
      name: { type: "string", example: "John Doe" },
      cpf: { type: "string", example: "529.982.247-25" },
      email: {
        type: "string",
        format: "email",
        example: "john.doe@example.com",
      },
      password: { type: "string", example: "strong-password" },
    },
  },
};
