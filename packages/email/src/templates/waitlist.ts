import { escapeHtml } from "./utils";

export interface WaitlistConfirmationEmailInput {
  appName: string;
  userName: string;
}

/**
 * Renders the confirmation email sent to a user after they join the waitlist.
 */
export function renderWaitlistConfirmationEmail({
  appName,
  userName,
}: WaitlistConfirmationEmailInput) {
  return {
    subject: `You're on the list! Welcome to ${appName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0 0 20px; font-size: 32px; line-height: 1.1;">You're on the list, ${escapeHtml(userName)}.</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424242;">
            Thanks for joining the ${escapeHtml(appName)} waitlist! We're currently reviewing applications and evaluating startup ideas to ensure we're a great fit for each other.
          </p>
          <div style="padding: 18px 20px; border-radius: 18px; background: #f5efe7; color: #4b3622; font-size: 14px; line-height: 1.5;">
            We'll be in touch soon with an update on your application status. In the meantime, feel free to reply to this email if you have any questions.
          </div>
        </div>
      </div>
    `,
    text: [
      `You're on the list, ${userName}.`,
      "",
      `Thanks for joining the ${appName} waitlist! We're currently reviewing applications and evaluating startup ideas to ensure we're a great fit for each other.`,
      "",
      "We'll be in touch soon with an update on your application status.",
    ].join("\n"),
  };
}

export interface WaitlistAdminNotificationEmailInput {
  appName: string;
  name: string;
  email: string;
  companyName?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  problemSolved?: string | null;
  targetAudience?: string | null;
  willingToPay?: string | null;
  willingToSwitch?: string | null;
}

/**
 * Renders the notification email sent to admins when a new waitlist entry is submitted.
 */
export function renderWaitlistAdminNotificationEmail(input: WaitlistAdminNotificationEmailInput) {
  const { appName, name, email, companyName, websiteUrl, description, problemSolved, targetAudience, willingToPay, willingToSwitch } = input;

  const rows = ([
    ["Name", name],
    ["Email", email],
    ["Company", companyName],
    ["Website", websiteUrl],
    ["Description", description],
    ["Problem Solved", problemSolved],
    ["Target Audience", targetAudience],
    ["Willing to Pay", willingToPay],
    ["Willing to Switch", willingToSwitch],
  ] as [string, string | null | undefined][]).filter(([_, value]) => !!value) as [string, string][];

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding: 8px 0; font-weight: 600; width: 140px; vertical-align: top;">${escapeHtml(label)}:</td>
      <td style="padding: 8px 0; vertical-align: top;">${escapeHtml(value)}</td>
    </tr>
  `).join("");

  const textContent = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  return {
    subject: `New Waitlist Submission: ${name}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)} Admin</p>
          <h1 style="margin: 0 0 20px; font-size: 24px; line-height: 1.1;">New Waitlist Submission</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5; color: #424242;">
            ${htmlRows}
          </table>
        </div>
      </div>
    `,
    text: `New Waitlist Submission for ${appName}:\n\n${textContent}`,
  };
}
