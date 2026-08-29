import { z } from "zod";

export const createExampleTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  completed: z.boolean().default(false),
});

export const updateExampleTaskSchema = createExampleTaskSchema.partial();

export type ICreateExampleTask = z.infer<typeof createExampleTaskSchema>;
export type IUpdateExampleTask = z.infer<typeof updateExampleTaskSchema>;