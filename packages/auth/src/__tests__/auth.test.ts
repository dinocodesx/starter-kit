import test from "node:test";
import assert from "node:assert/strict";
import { assertAuthenticated, canManageWorkspace } from "../guards/index.js";

test("assertAuthenticated returns the session value", () => {
  const session = assertAuthenticated({ userId: "user_123" });

  assert.deepEqual(session, { userId: "user_123" });
});

test("assertAuthenticated throws when the session is missing", () => {
  assert.throws(() => assertAuthenticated(null), /Authentication required/);
});

test("canManageWorkspace only allows owner and editor", () => {
  assert.equal(canManageWorkspace("owner"), true);
  assert.equal(canManageWorkspace("editor"), true);
  assert.equal(canManageWorkspace("viewer"), false);
});
