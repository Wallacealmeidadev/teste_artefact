import { randomUUID } from "node:crypto";
import type { Task, TaskFields } from "../shared/task";

// Route handlers and Server Components can have separate module bundles in one process.
const processState = globalThis as typeof globalThis & { artefactTasks?: Map<string, Task> };
const tasks = (processState.artefactTasks ??= new Map<string, Task>());

export function listTasks() {
  // Map preserves insertion order, including when an existing entry is updated.
  return Array.from(tasks.values()).reverse();
}

export function findTask(id: string) {
  return tasks.get(id);
}

export function createTask(fields: TaskFields) {
  const task = { ...fields, id: randomUUID(), createdAt: Date.now() };
  tasks.set(task.id, task);
  return task;
}

export function updateTask(id: string, fields: TaskFields) {
  const existing = tasks.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...fields };
  tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string) {
  return tasks.delete(id);
}
