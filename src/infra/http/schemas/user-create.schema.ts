import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

export const userCreateBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z
    .string()
    .refine(Role.validate, { message: "Invalid Role" })
    .default("DELIVERER"),
});

export type UserCreateBodySchema = z.infer<typeof userCreateBodySchema>;

export const userCreateApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["name", "cpf", "email", "password", "role"],
    properties: {
      name: { type: "string", example: "Jane Admin" },
      cpf: { type: "string", example: "111.222.333-44" },
      email: {
        type: "string",
        format: "email",
        example: "jane@fastfeet.com",
      },
      password: { type: "string", example: "strong-password" },
      role: { type: "string", enum: ["ADMIN", "DELIVERER", "RECIPIENT"] },
    },
  },
};
