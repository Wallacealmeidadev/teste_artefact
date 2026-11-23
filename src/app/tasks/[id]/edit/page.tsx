import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { TaskForm } from "../../../../components/task-form";
import { serverCaller } from "../../../../server/router";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await serverCaller.task.byId({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) {
      notFound();
    }
    throw error;
  });
  return (
    <main>
      <h1>Edit task</h1>
      <TaskForm task={task} />
    </main>
  );
}
