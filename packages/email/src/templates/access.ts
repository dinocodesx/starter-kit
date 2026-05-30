import { escapeHtml } from "./utils";

export interface AccessEmailTemplateInput {
  appName: string;
  userName?: string | null;
  stage: "Alpha" | "Beta";
  loginUrl: string;
}

/**
 * Renders an invitation email for Alpha or Beta access.
 */
export function renderAccessInvitationEmail({
  appName,
  userName,
  stage,
  loginUrl,
}: AccessEmailTemplateInput) {
  const recipientName = userName?.trim() || "there";

  return {
    subject: `You're invited: ${appName} ${stage} Access`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)} — ${stage}</p>
          <h1 style="margin: 0 0 20px; font-size: 32px; line-height: 1.1;">Welcome to the ${stage}.</h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424242;">
            Hi ${escapeHtml(recipientName)}, we're excited to grant you early access to ${escapeHtml(appName)}. As an ${stage} participant, your feedback will directly shape the future of the product.
          </p>
          <div style="margin-bottom: 32px; padding: 18px 20px; border-radius: 18px; background: #f5efe7; color: #4b3622; font-size: 14px; line-height: 1.5;">
            Ready to dive in? Use the link below to sign in and start exploring.
          </div>
          <div style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background: #121212; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">Sign in to ${appName}</a>
          </div>
          <p style="margin: 32px 0 0; font-size: 14px; color: #757575;">
            Note: This is an early ${stage} release. You may encounter bugs or unfinished features. Please report any issues directly to us!
          </p>
        </div>
      </div>
    `,
    text: [
      `Welcome to the ${appName} ${stage}.`,
      "",
      `Hi ${recipientName}, we're excited to grant you early access to ${appName}.`,
      "",
      `Ready to dive in? Sign in here: ${loginUrl}`,
      "",
      `Note: This is an early ${stage} release. Please report any issues!`,
    ].join("\n"),
  };
}
