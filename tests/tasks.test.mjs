import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";

async function rpc(method, name, input) {
  const url = new URL(`/api/trpc/task.${name}`, base);
  const options = { method };
  if (method === "POST") {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(input);
  } else if (input !== undefined) {
    url.searchParams.set("input", JSON.stringify(input));
  }
  const response = await fetch(url, options);
  const body = await response.json();
  return { status: response.status, data: body.result?.data, error: body.error?.data.code };
}

async function createFixture(t, fields) {
  const result = await rpc("POST", "create", fields);
  assert.equal(result.status, 200);
  t.after(async () => {
    const cleanup = await rpc("POST", "delete", { id: result.data.id });
    assert.ok(cleanup.status === 200 || cleanup.error === "NOT_FOUND");
  });
  return result.data;
}

async function list() {
  const result = await rpc("GET", "list");
  assert.equal(result.status, 200);
  return result.data;
}

function expectError(result, status, code) {
  assert.equal(result.status, status);
  assert.equal(result.error, code);
}

test("CRUD preserves identity and creation time and only removes the selected task", async t => {
  const first = await createFixture(t, { title: "  Review sample  ", description: "  Draft  " });
  const second = await createFixture(t, { title: "Review sample" });
  assert.equal(first.title, "Review sample");
  assert.equal(first.description, "Draft");
  assert.equal(second.description, undefined);
  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^[0-9a-f-]{36}$/);
  assert.ok(Number.isSafeInteger(first.createdAt) && first.createdAt > 0);
  const ids = (await list()).map(task => task.id);
  assert.ok(ids.indexOf(second.id) >= 0 && ids.indexOf(second.id) < ids.indexOf(first.id));
  const edited = await rpc("POST", "update", { id: first.id, title: "Edited sample", description: " " });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.data, { id: first.id, title: "Edited sample", createdAt: first.createdAt });
  assert.deepEqual((await rpc("GET", "byId", { id: first.id })).data, edited.data);
  assert.deepEqual((await rpc("POST", "delete", { id: first.id })).data, { id: first.id });
  const remaining = await list();
  assert.equal(remaining.some(task => task.id === first.id), false);
  assert.ok(remaining.some(task => task.id === second.id));
});

test("invalid creates return BAD_REQUEST, including missing, empty and whitespace titles", async () => {
  for (const input of [{}, { title: "" }, { title: "  \t " }, { title: 5 },
    { title: "Sample", description: 1 }, { title: "Sample", createdAt: 1 }]) {
    expectError(await rpc("POST", "create", input), 400, "BAD_REQUEST");
  }
});

test("an invalid update leaves the original task intact", async t => {
  const task = await createFixture(t, { title: "Keep this sample" });
  expectError(await rpc("POST", "update", { id: task.id, title: "   " }), 400, "BAD_REQUEST");
  assert.deepEqual((await rpc("GET", "byId", { id: task.id })).data, task);
});

test("read, update and delete distinguish a missing task from a malformed ID", async () => {
  for (const [id, status, code] of [[randomUUID(), 404, "NOT_FOUND"], ["invalid", 400, "BAD_REQUEST"]]) {
    expectError(await rpc("GET", "byId", { id }), status, code);
    expectError(await rpc("POST", "update", { id, title: "Example" }), status, code);
    expectError(await rpc("POST", "delete", { id }), status, code);
  }
});

async function homeMarkup() {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  const html = await response.text();
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

test("request-time SSR shows HTTP mutations in successive HTML responses without running JavaScript", async t => {
  const title = `SSR sample ${randomUUID()}`;
  assert.ok(!(await homeMarkup()).includes(title));
  const task = await createFixture(t, { title });
  assert.ok((await homeMarkup()).includes(`<h2>${title}</h2>`));
  const updated = await rpc("POST", "update", { id: task.id, title: `${title} revised` });
  assert.equal(updated.status, 200);
  const revised = await homeMarkup();
  assert.ok(revised.includes(`<h2>${title} revised</h2>`));
  assert.ok(!revised.includes(`<h2>${title}</h2>`));
  assert.equal((await rpc("POST", "delete", { id: task.id })).status, 200);
  assert.ok(!(await homeMarkup()).includes(title));
});
