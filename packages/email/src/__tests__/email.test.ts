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

import { renderLoginEmail, renderChangelogEmail, renderInvoiceEmail } from "../templates/index.js";

test("login template includes timestamp and security warning", () => {
  const template = renderLoginEmail({
    appName: "TestApp",
    timestamp: "2024-01-01 12:00:00",
    location: "London, UK",
  });

  assert.match(template.subject, /New login/);
  assert.match(template.html, /London, UK/);
  assert.match(template.html, /secure your account/);
});

test("changelog template includes version and updates", () => {
  const template = renderChangelogEmail({
    appName: "TestApp",
    version: "1.2.3",
    publishDate: "2024-01-01",
    updates: [{ title: "Feature X", description: "Does something cool" }],
  });

  assert.match(template.subject, /v1\.2\.3/);
  assert.match(template.html, /Feature X/);
  assert.match(template.html, /Does something cool/);
});

test("invoice template includes amount and items", () => {
  const template = renderInvoiceEmail({
    appName: "TestApp",
    invoiceId: "INV-001",
    invoiceDate: "2024-01-01",
    amountPaid: "29.00",
    currency: "$",
    items: [{ description: "Pro Plan", amount: "29.00" }],
  });

  assert.match(template.subject, /INV-001/);
  assert.match(template.html, /Pro Plan/);
  assert.match(template.html, /\$29\.00/);
});

test("email templates list the expected workflow templates", () => {
  assert.deepEqual(emailTemplates, [
    "welcome",
    "upgrade",
    "trial-ending",
    "waitlist-confirmation",
    "waitlist-admin-notification",
    "login",
    "logout",
    "changelog",
    "invoice",
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
  assert.strictEqual(typeof service.sendLoginEmail, "function");
  assert.strictEqual(typeof service.sendLogoutEmail, "function");
  assert.strictEqual(typeof service.sendChangelogEmail, "function");
  assert.strictEqual(typeof service.sendInvoiceEmail, "function");
});
