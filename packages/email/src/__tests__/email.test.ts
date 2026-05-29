import test from "node:test";
import assert from "node:assert/strict";
import { emailTemplates, renderWelcomeEmail } from "../templates/index.js";
import { readEmailEnvironment } from "../config.js";
import { createEmailService } from "../workflows/index.js";

// ─── template rendering ─────────────────────────────────────────────────────

test("welcome template includes the workspace name and recipient", () => {
  const template = renderWelcomeEmail({
    appName: "your workspace",
    userName: "Ada",
  });

  assert.equal(template.subject, "Welcome to your workspace");
  assert.match(template.html, /Ada/);
  assert.match(template.text, /your workspace/);
});

test("email templates list the expected workflow templates", () => {
  assert.deepEqual(emailTemplates, [
    "welcome",
    "upgrade",
    "trial-ending",
    "waitlist-confirmation",
    "waitlist-admin-notification",
  ]);
});

test("renderWelcomeEmail falls back to 'there' when userName is not provided", () => {
  const template = renderWelcomeEmail({ appName: "TestApp" });
  assert.match(template.html, /there/);
  assert.match(template.text, /there/);
});

// ─── readEmailEnvironment ───────────────────────────────────────────────────

test("readEmailEnvironment parses valid environment variables", () => {
  const env = readEmailEnvironment({
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_ADDRESS: "Test <test@example.com>",
    APP_NAME: "TestApp",
  });

  assert.equal(env.resendApiKey, "re_test_key");
  assert.equal(env.fromAddress, "Test <test@example.com>");
  assert.equal(env.appName, "TestApp");
});

test("readEmailEnvironment applies defaults for optional variables", () => {
  const env = readEmailEnvironment({ RESEND_API_KEY: "re_test_key" });

  assert.match(env.fromAddress, /onboarding@resend.dev/);
  assert.equal(env.appName, "your workspace");
});

test("readEmailEnvironment throws when RESEND_API_KEY is missing", () => {
  assert.throws(
    () => readEmailEnvironment({}),
    /Invalid email environment configuration/,
  );
});

// ─── createEmailService ───────────────────────────────────────────────────

test("createEmailService throws at construction when resendApiKey is empty", () => {
  const store = {
    create: async () => { throw new Error("should not be called"); },
    markSent: async () => { throw new Error("should not be called"); },
    markFailed: async () => { throw new Error("should not be called"); },
  };

  assert.throws(
    () => createEmailService({ store, resendApiKey: "" }),
    /resendApiKey is required/,
  );
});

test("createEmailService returns all expected methods", () => {
  const store = {
    create: async () => { throw new Error("should not be called"); },
    markSent: async () => { throw new Error("should not be called"); },
    markFailed: async () => { throw new Error("should not be called"); },
  };

  const service = createEmailService({ store, resendApiKey: "re_test_key" });

  assert.strictEqual(typeof service.sendEmail, "function");
  assert.strictEqual(typeof service.sendWelcomeEmail, "function");
  assert.strictEqual(typeof service.sendUpgradeEmail, "function");
  assert.strictEqual(typeof service.sendTrialEndingEmail, "function");
});
