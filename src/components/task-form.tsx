"use client";

import { useState, type FormEvent } from "react";
import { api, mutationErrorMessage } from "../lib/trpc-client";
import { taskFields, type Task } from "../shared/task";

export function TaskForm({ task }: { task?: Task }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [titleError, setTitleError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const result = taskFields.safeParse({ title, description });
    if (!result.success) {
      setTitleError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      if (task) {
        await api.task.update.mutate({ ...result.data, id: task.id });
      } else {
        await api.task.create.mutate(result.data);
      }
      window.location.replace(task ? "/?result=updated" : "/?result=created");
    } catch (cause) {
      setError(mutationErrorMessage(cause));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" value={title} required disabled={saving}
        aria-invalid={Boolean(titleError)} aria-describedby={titleError ? "title-error" : undefined}
        onChange={event => { setTitle(event.target.value); setTitleError(""); }} />
      {titleError && <p id="title-error" role="alert">{titleError}</p>}
      <label htmlFor="description">Description <span>(optional)</span></label>
      <textarea id="description" name="description" rows={5} value={description}
        disabled={saving} onChange={event => setDescription(event.target.value)} />
      {error && <p role="alert">{error}</p>}
      <div className="actions">
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Saving…" : task ? "Save changes" : "Create task"}
        </button>
        <a href="/">Back to tasks</a>
      </div>
    </form>
  );
}
