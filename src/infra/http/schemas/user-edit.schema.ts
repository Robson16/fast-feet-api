import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

import { Role } from "@/domain/user/enterprise/entities/value-objects/role";

export const editUserBodySchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email().optional(),
  role: z
    .string()
    .refine(Role.validate, { message: "Invalid Role" })
    .optional(),
});

export type EditUserBodySchema = z.infer<typeof editUserBodySchema>;

export const editUserApiBody: ApiBodyOptions = {
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
