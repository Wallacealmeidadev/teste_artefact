"use client";

import { useState } from "react";
import { api, mutationErrorMessage } from "../lib/trpc-client";

export function DeleteTaskButton({ id, title }: { id: string; title: string }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await api.task.delete.mutate({ id });
      window.location.replace("/?result=deleted");
    } catch (cause) {
      setError(mutationErrorMessage(cause));
      setDeleting(false);
    }
  }

  return (
    <div>
      <button className="delete" type="button" disabled={deleting} onClick={remove}
        aria-label={`Delete ${title}`}>{deleting ? "Deleting…" : "Delete"}</button>
      {error && <p role="alert">{error} <a href="/">Reload tasks</a></p>}
    </div>
  );
}
