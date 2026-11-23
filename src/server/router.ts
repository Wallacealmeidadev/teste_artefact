import { initTRPC, TRPCError } from "@trpc/server";
import { taskFields, taskId, taskUpdate } from "../shared/task";
import { createTask, deleteTask, findTask, listTasks, updateTask } from "./task-store";

const t = initTRPC.create();

function missingTask() {
  return new TRPCError({ code: "NOT_FOUND", message: "This task no longer exists." });
}

const taskRouter = t.router({
  list: t.procedure.query(() => listTasks()),
  byId: t.procedure.input(taskId).query(({ input }) => {
    const task = findTask(input.id);
    if (!task) throw missingTask();
    return task;
  }),
  create: t.procedure.input(taskFields).mutation(({ input }) => createTask(input)),
  update: t.procedure.input(taskUpdate).mutation(({ input: { id, title, description } }) => {
    const task = updateTask(id, { title, description });
    if (!task) throw missingTask();
    return task;
  }),
  delete: t.procedure.input(taskId).mutation(({ input }) => {
    if (!deleteTask(input.id)) throw missingTask();
    return { id: input.id };
  }),
});

export const appRouter = t.router({ task: taskRouter });
export type AppRouter = typeof appRouter;
export const serverCaller = appRouter.createCaller({});
