import { serverCaller } from "../server/router";
import { DeleteTaskButton } from "../components/delete-task-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const notices = new Map([
  ["created", "Task created."],
  ["updated", "Task updated."],
  ["deleted", "Task deleted."],
]);

export default async function HomePage({ searchParams }: {
  searchParams: Promise<{ result?: string | string[] }>;
}) {
  const [tasks, { result }] = await Promise.all([serverCaller.task.list(), searchParams]);
  const notice = typeof result === "string" ? notices.get(result) : undefined;
  return (
    <main>
      <header className="page-heading">
        <h1>Tasks</h1>
        <a className="button" href="/tasks/new">New task</a>
      </header>
      {notice && <p className="notice" role="status">{notice}</p>}
      {tasks.length === 0 ? (
        <p className="empty">No tasks yet.</p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id}>
              <div className="task-details">
                <h2>{task.title}</h2>
                {task.description && <p className="description">{task.description}</p>}
                <time dateTime={new Date(task.createdAt).toISOString()}>
                  {dateFormat.format(task.createdAt)} UTC
                </time>
              </div>
              <div className="actions">
                <a href={`/tasks/${task.id}/edit`} aria-label={`Edit ${task.title}`}>Edit</a>
                <DeleteTaskButton id={task.id} title={task.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
