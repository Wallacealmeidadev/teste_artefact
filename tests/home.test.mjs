import assert from "node:assert/strict";
import test from "node:test";

test("the home route serves the task heading in the HTML response", async () => {
  const response = await fetch(process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /<h1>Tasks<\/h1>/);
});
