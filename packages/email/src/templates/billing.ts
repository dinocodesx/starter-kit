import { escapeHtml } from "./utils";

/**
 * Renders the upgrade confirmation email sent when a workspace's plan is
 * changed to a paid tier.
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
 */
export function renderTrialEndingEmail(appName: string, message = "Your trial is ending soon.") {
  return {
    subject: `${appName} trial ending soon`,
    html: `<p>${escapeHtml(message)}</p>`,
    text: message,
  };
}
