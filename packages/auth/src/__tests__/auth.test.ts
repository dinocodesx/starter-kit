import test from "node:test";
import assert from "node:assert/strict";
import { assertAuthenticated, canManageWorkspace } from "../guards/index.js";
import { readAuthEnvironment } from "../config/index.js";
import { workspaceRoles } from "../roles/index.js";

// ─── guards ──────────────────────────────────────────────────────────────────

test("assertAuthenticated returns the session value", () => {
  const session = assertAuthenticated({ userId: "user_123" });

  assert.deepEqual(session, { userId: "user_123" });
});

test("assertAuthenticated throws when the session is null", () => {
  assert.throws(() => assertAuthenticated(null), /Authentication required/);
});

test("assertAuthenticated throws when the session is undefined", () => {
  assert.throws(() => assertAuthenticated(undefined), /Authentication required/);
});

test("assertAuthenticated accepts a custom error message", () => {
  assert.throws(
    () => assertAuthenticated(null, "Please log in first"),
    /Please log in first/,
  );
});

test("canManageWorkspace only allows owner and editor", () => {
  assert.equal(canManageWorkspace("owner"), true);
  assert.equal(canManageWorkspace("editor"), true);
  assert.equal(canManageWorkspace("viewer"), false);
  assert.equal(canManageWorkspace("unknown"), false);
});

// ─── roles ───────────────────────────────────────────────────────────────────

test("workspaceRoles contains exactly owner, editor, viewer", () => {
  assert.deepEqual(workspaceRoles, ["owner", "editor", "viewer"]);
});

// ─── readAuthEnvironment ─────────────────────────────────────────────────────

test("readAuthEnvironment parses valid environment variables", () => {
  const env = readAuthEnvironment({
    BETTER_AUTH_URL: "https://example.com",
    BETTER_AUTH_SECRET: "super-secret",
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
  });

  assert.equal(env.baseURL, "https://example.com");
  assert.equal(env.secret, "super-secret");
  assert.equal(env.googleClientId, "google-id");
  assert.equal(env.googleClientSecret, "google-secret");
});

test("readAuthEnvironment falls back to AUTH_URL when BETTER_AUTH_URL is unset", () => {
  const env = readAuthEnvironment({
    AUTH_URL: "https://fallback.example.com",
    BETTER_AUTH_SECRET: "secret",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret2",
  });

  assert.equal(env.baseURL, "https://fallback.example.com");
});

test("readAuthEnvironment throws on missing required variables", () => {
  assert.throws(
    () => readAuthEnvironment({}),
    /Invalid auth environment configuration/,
  );
});

test("readAuthEnvironment throws when baseURL is not a valid URL", () => {
  assert.throws(
    () =>
      readAuthEnvironment({
        BETTER_AUTH_URL: "not-a-url",
        BETTER_AUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret2",
      }),
    /Invalid auth environment configuration/,
  );
});
