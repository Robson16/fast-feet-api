import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

export const userEditBodySchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email().optional(),
  role: z
    .string()
    .refine(Role.validate, { message: "Invalid Role" })
    .optional(),
});

export type UserEditBodySchema = z.infer<typeof userEditBodySchema>;

export const userEditApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    properties: {
      name: { type: "string", example: "Jane Updated" },
      cpf: { type: "string", example: "111.222.333-44" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["ADMIN", "DELIVERER", "RECIPIENT"] },
    },
  },
};
