import z from "zod";

export const packetListByRecipientQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().min(1)),
});

export type PacketListByRecipientQuerySchema = z.infer<
  typeof packetListByRecipientQuerySchema
>;
