import { z } from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  cursor: z.string().min(1).max(500).optional(),
});

export type IIdParam = z.infer<typeof idParamSchema>;
export type IPaginationQuery = z.infer<typeof paginationQuerySchema>;
