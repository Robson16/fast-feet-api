import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().optional().default(3333),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(24 * 60 * 60)
    .optional()
    .default(15 * 60),
  APP_ADMIN_PASSWORD: z.string(),
});

export type Env = z.infer<typeof envSchema>;
