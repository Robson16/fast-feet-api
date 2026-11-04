import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const profileChangePasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(6, "The password must be at least 6 characters long."),
});

export type ProfileChangePasswordBodySchema = z.infer<
  typeof profileChangePasswordBodySchema
>;

export const profileChangePasswordApiBody: ApiBodyOptions = {
  schema: {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
      currentPassword: {
        type: "string",
        format: "password",
        example: "current-password",
      },
      newPassword: {
        type: "string",
        format: "password",
        minLength: 6,
        example: "new-strong-password",
      },
    },
  },
};
