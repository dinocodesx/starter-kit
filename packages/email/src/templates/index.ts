export const emailTemplates = ["welcome", "upgrade", "trial-ending"] as const;

export type EmailTemplateName = (typeof emailTemplates)[number];

/**
 * Escapes the five characters that have special meaning in HTML so that
 * user-supplied strings can be safely interpolated into HTML email bodies
 * without risk of XSS or broken markup.
 *
 * Replaces: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`,
 *           `"` → `&quot;`, `'` → `&#39;`.
 */
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface WelcomeEmailTemplateInput {
  appName: string;
  userName?: string | null;
}

/**
 * Renders the welcome email sent to a user immediately after their account is
 * created.
 *
 * Falls back to `"there"` when `userName` is not provided or is blank, so the
 * greeting is always grammatically complete ("Welcome, there." rather than
 * "Welcome, .").
 *
 * Returns an object with three fields:
 * - `subject` — the email subject line.
 * - `html`    — the full HTML body, with all user-supplied values escaped.
 * - `text`    — the plain-text fallback for email clients that do not render HTML.
 */
export function renderWelcomeEmail({
  appName,
  userName,
}: WelcomeEmailTemplateInput) {
  const recipientName = userName?.trim() || "there";

  return {
    subject: `Welcome to ${appName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0 0 20px; font-size: 32px; line-height: 1.1;">Welcome, ${escapeHtml(recipientName)}.</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424242;">
            Your account is ready, and the core auth + email stack is now wired for this workspace.
          </p>
          <div style="padding: 18px 20px; border-radius: 18px; background: #f5efe7; color: #4b3622; font-size: 14px; line-height: 1.5;">
            You can now sign in with Google, persist auth data in Prisma, and track outgoing email deliveries through Resend.
          </div>
        </div>
      </div>
    `,
    text: [
      `Welcome, ${recipientName}.`,
      "",
      `Your account is ready, and the core auth + email stack is now wired for ${appName}.`,
      "",
      "You can now sign in with Google, persist auth data in Prisma, and track outgoing email deliveries through Resend.",
    ].join("\n"),
  };
}

/**
 * Renders the upgrade confirmation email sent when a workspace's plan is
 * changed to a paid tier.
 *
 * `message` defaults to a generic upgrade notice and is always HTML-escaped
 * before being embedded in the body, so callers can pass arbitrary strings
 * from the billing system without risk.
 */
export function renderUpgradeEmail(appName: string, message = "Your workspace has been upgraded.") {
  return {
    subject: `${appName} upgrade`,
    html: `<p>${escapeHtml(message)}</p>`,
    text: message,
  };
}

/**
 * Renders the trial-ending reminder email sent a few days before a
 * workspace's free trial expires.
 *
 * `message` defaults to a generic reminder and is HTML-escaped before use,
 * allowing dynamic copy (e.g. including the exact expiry date) to be passed
 * in safely.
 */
export function renderTrialEndingEmail(appName: string, message = "Your trial is ending soon.") {
  return {
    subject: `${appName} trial ending soon`,
    html: `<p>${escapeHtml(message)}</p>`,
    text: message,
  };
}
