import { escapeHtml } from "./utils";

export interface ChangelogEmailTemplateInput {
  appName: string;
  version: string;
  publishDate: string;
  updates: { title: string; description: string }[];
  ctaUrl?: string;
}

/**
 * Renders the changelog/product update email.
 */
export function renderChangelogEmail({
  appName,
  version,
  publishDate,
  updates,
  ctaUrl,
}: ChangelogEmailTemplateInput) {
  const updatesHtml = updates
    .map(
      (update) => `
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 18px; color: #121212;">${escapeHtml(update.title)}</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #424242;">${escapeHtml(update.description)}</p>
    </div>
  `,
    )
    .join("");

  const updatesText = updates
    .map((update) => `${update.title}\n${update.description}\n`)
    .join("\n");

  return {
    subject: `What's new in ${appName} v${version}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f7f3ef; color: #121212; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(18, 18, 18, 0.08);">
          <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6247;">${escapeHtml(appName)} — ${escapeHtml(publishDate)}</p>
          <h1 style="margin: 0 0 24px; font-size: 32px; line-height: 1.1;">Version ${escapeHtml(version)} is here.</h1>
          
          ${updatesHtml}

          ${
            ctaUrl
              ? `
          <div style="margin-top: 32px;">
            <a href="${ctaUrl}" style="display: inline-block; background: #121212; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 500; font-size: 15px;">View full changelog</a>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `,
    text: [
      `What's new in ${appName} v${version}`,
      `Published on ${publishDate}`,
      "",
      updatesText,
      ctaUrl ? `View full changelog: ${ctaUrl}` : "",
    ].filter(Boolean).join("\n"),
  };
}
