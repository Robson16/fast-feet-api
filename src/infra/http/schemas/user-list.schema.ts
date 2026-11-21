import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type UserListQuerySchema = z.infer<typeof userListQuerySchema>;
