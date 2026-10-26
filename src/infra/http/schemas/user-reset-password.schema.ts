import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const userResetPasswordBodySchema = z.object({
  newPassword: z
    .string()
    .min(6, "The password must be at least 6 characters long."),
});

export type UserResetPasswordBodySchema = z.infer<
  typeof userResetPasswordBodySchema
>;

export const userResetPasswordApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["password"],
    properties: {
      newPassword: {
        type: "string",
        format: "password",
        example: "new-strong-password",
      },
    },
  },
};
