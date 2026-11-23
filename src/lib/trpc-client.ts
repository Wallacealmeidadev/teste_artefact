import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../server/router";

export const api = createTRPCClient<AppRouter>({
  links: [httpLink({ url: "/api/trpc" })],
});

export function mutationErrorMessage(error: unknown) {
  if (error instanceof TRPCClientError) {
    if (error.data?.code === "NOT_FOUND") return "This task no longer exists. Return to the list to see current tasks.";
    if (error.data?.code === "BAD_REQUEST") return "Check the task details and try again.";
  }
  return "The change could not be confirmed. Check the task list before trying again.";
}
