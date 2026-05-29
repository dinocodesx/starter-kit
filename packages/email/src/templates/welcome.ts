import { escapeHtml } from "./utils";

export interface WelcomeEmailTemplateInput {
  appName: string;
  userName?: string | null;
}

/**
 * Renders the welcome email sent to a user immediately after their account is
 * created.
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
