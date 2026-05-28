import test from "node:test";
import assert from "node:assert/strict";
import { getMailerProvider, mailerProviders, } from "../senders/index.js";
import { emailTemplates, renderWelcomeEmail } from "../templates/index.js";
test("mailer provider is resend", () => {
    assert.equal(getMailerProvider(), "resend");
    assert.deepEqual(mailerProviders, ["resend"]);
});
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
    assert.deepEqual(emailTemplates, ["welcome", "upgrade", "trial-ending"]);
});
