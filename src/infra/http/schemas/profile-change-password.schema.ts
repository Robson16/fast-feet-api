import type { ApiBodyOptions } from "@nestjs/swagger";
import { z } from "zod";

export const profileChangePasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
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
        example: "new-strong-password",
      },
    },
  },
};
