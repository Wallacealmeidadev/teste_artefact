# Task Manager

A single Next.js 15 application for creating, listing, editing and deleting tasks. The initial page includes the current tasks in its HTML. The browser handles form input and sends mutations to the same tRPC router used by the server-rendered pages.

## Run locally

Use Node.js 24 and npm. From the project directory:

```sh
npm ci
npm run dev
```

Open [the task list](http://localhost:3000). The store starts empty in a fresh process. No environment variables, accounts or database setup are required.

## Verify a production build

Stop the development server. In the first terminal, run:

```sh
npm run typecheck
npm run build
npm start
```

In a second terminal, from the project directory:

```sh
npm test
```

The tests use Node's test runner and make real HTTP requests to the running application. They create fictitious tasks and clean up their records. To use another port, start the application with `npm start -- --port 3107` and set `TEST_BASE_URL` to `http://127.0.0.1:3107` in the test terminal. In Windows PowerShell, use `npm.cmd` if the local execution policy blocks `npm.ps1`.

The suite checks the home page, CRUD, validation, missing records, stable IDs and timestamps, and request-time rendering. The SSR test creates a unique task through HTTP after startup, reads the raw HTML without executing JavaScript, removes script elements, and looks for the task heading. It repeats the check after editing and deleting.

## Manual checks

1. Open the task list and choose **New task**. Submit a title consisting of spaces. The form should display a field error and keep the entered values.
2. Create a task titled **Review sample outline**. The list should show the new title and a success message. Reopen the home page with JavaScript disabled to verify that the task is visible. Re-enable JavaScript to use the interactive controls.
3. Choose **Edit**, change the title and clear the description. Save and reload. The edited title should remain and the description should be absent.
4. Open the edit page in another tab. Delete the task from the list in the first tab, then try to save from the stale tab. The form should report that the task no longer exists. Opening its edit URL again should display the missing-page screen.
5. Restart the server and reload the list. All tasks from the previous process disappear.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/shared/task.ts` | Zod schemas for editable fields and IDs, plus the task type. |
| `src/server/task-store.ts` | Synchronous operations on a process-local Map. A key on the Node.js global object gives the HTTP handler and the page bundles access to the same collection. |
| `src/server/router.ts` | tRPC procedures, input validation, missing-record errors and the in-process caller. |
| `src/app/api/trpc/[trpc]/route.ts` | Fetch adapter that receives tRPC requests over HTTP. |
| `src/app/page.tsx` | Dynamic Server Component that calls `task.list` on each request and renders the initial list. |
| `src/app/tasks/` | Creation page and dynamic edit page. Editing a direct URL calls `task.byId` on the server. |
| `src/components/`, `src/lib/trpc-client.ts` | Client Components for forms and deletion, typed HTTP client and user-facing mutation errors. |
| `tests/` | HTTP integration and server-rendered HTML tests against a running instance. |

Opening the list invokes the router's server caller directly. The page explicitly uses `force-dynamic` so a task created after the build can appear in the next response. The Node.js runtime hosts the store. Rendering the new-task page ahead of time is sufficient because its form starts empty.

Saving a form follows a different path. The Client Component validates the fields locally and uses the typed tRPC client to send a POST request. The adapter dispatches the named procedure, Zod validates the incoming JSON again, and the store applies the change synchronously. The handler returns the result or a structured tRPC error. After success the browser navigates to the list with a fixed feedback code, issuing a fresh document request. This keeps the list synchronized without a browser-side task cache. On failure the form retains the draft and offers a way back to the list.

## Task contract

| Procedure | Input | Result |
| --- | --- | --- |
| `task.create` (mutation) | Title and optional description | Created task with a server-generated UUID and creation timestamp in Unix milliseconds. |
| `task.list` (query) | None | All tasks, newest insertion first. Editing preserves the original order. |
| `task.byId` (query) | UUID | One task for the edit page. |
| `task.update` (mutation) | UUID, title and optional description | Task with its editable fields replaced. Omitting or clearing the description removes it. ID and creation time are preserved. |
| `task.delete` (mutation) | UUID | ID of the removed task. |

Titles and descriptions are trimmed. The title must contain a non-whitespace character. A blank description is treated as absent. Invalid inputs produce `BAD_REQUEST` (HTTP 400), including malformed IDs and attempts to supply unexpected server-owned fields. A valid ID that does not exist produces `NOT_FOUND` (HTTP 404) for reading, updating or deleting.

## Operational limits

- All visitors to one process share the same list. Restarting the process clears it. Separate workers, replicas or serverless instances each have their own memory. Run one Node.js instance for this exercise.
- Concurrent edits to the same record are applied in processing order. The last accepted edit wins. Other open tabs see changes on their next read.
- A transport failure can occur after the server applied a mutation. The interface asks the user to check the list before retrying. Create requests have no idempotency key.
- The entire list is rendered in one response. Memory usage and response size grow with the task count. This implementation targets the small dataset in the exercise.
- The PostCSS override selects version 8.5.33 within Next.js 15.5.29's dependency tree. The originally pinned release triggered npm audit advisories.

## Written submission

Read the [theory answers](docs/theory.md) or the [English PDF with the repository link](docs/technical-submission.pdf).
