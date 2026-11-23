import { z } from "zod";

export const taskFields = z.strictObject({
  title: z.string().trim().min(1, "Enter a title."),
  description: z.string().trim().optional().transform(value => value || undefined),
});

export const taskId = z.strictObject({ id: z.uuid() });
export const taskUpdate = taskFields.extend(taskId.shape);

export type TaskFields = z.output<typeof taskFields>;
export type Task = TaskFields & { id: string; createdAt: number };
