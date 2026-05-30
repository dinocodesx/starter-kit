import { escapeHtml } from "./utils";

export interface AuthEmailTemplateInput {
  appName: string;
  userName?: string | null;
  timestamp: string;
  location?: string | null;
  device?: string | null;
}

/**
 * Renders the login notification email.
 */
export function renderLoginEmail({
  appName,
  userName,
  timestamp,
  location,
  device,
}: AuthEmailTemplateInput) {
  const recipientName = userName?.trim() || "there";

  return {
    subject: `New login to ${appName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0 0 20px; font-size: 32px; line-height: 1.1;">Hi ${escapeHtml(recipientName)},</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424242;">
            A new login was detected for your account. If this was you, you can safely ignore this email.
          </p>
          <div style="padding: 18px 20px; border-radius: 18px; background: #f5efe7; color: #4b3622; font-size: 14px; line-height: 1.5;">
            <p style="margin: 0;"><strong>Time:</strong> ${escapeHtml(timestamp)}</p>
            ${location ? `<p style="margin: 4px 0 0;"><strong>Location:</strong> ${escapeHtml(location)}</p>` : ""}
            ${device ? `<p style="margin: 4px 0 0;"><strong>Device:</strong> ${escapeHtml(device)}</p>` : ""}
          </div>
          <p style="margin: 24px 0 0; font-size: 14px; color: #757575;">
            If you didn't recognize this activity, please secure your account immediately.
          </p>
        </div>
      </div>
    `,
    text: [
      `Hi ${recipientName},`,
      "",
      `A new login was detected for your account on ${appName}.`,
      "",
      `Time: ${timestamp}`,
      location ? `Location: ${location}` : "",
      device ? `Device: ${device}` : "",
      "",
      "If you didn't recognize this activity, please secure your account immediately.",
    ].filter(Boolean).join("\n"),
  };
}

/**
 * Renders the logout notification email.
 */
export function renderLogoutEmail({
  appName,
  userName,
  timestamp,
}: Pick<AuthEmailTemplateInput, "appName" | "userName" | "timestamp">) {
  const recipientName = userName?.trim() || "there";

  return {
    subject: `You've been logged out of ${appName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0 0 20px; font-size: 32px; line-height: 1.1;">Goodbye, ${escapeHtml(recipientName)}.</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424242;">
            You have successfully logged out of your ${escapeHtml(appName)} account.
          </p>
          <div style="padding: 18px 20px; border-radius: 18px; background: #f5efe7; color: #4b3622; font-size: 14px; line-height: 1.5;">
            Logout at: ${escapeHtml(timestamp)}
          </div>
        </div>
      </div>
    `,
    text: [
      `Goodbye, ${recipientName}.`,
      "",
      `You have successfully logged out of your ${appName} account at ${timestamp}.`,
    ].join("\n"),
  };
}
