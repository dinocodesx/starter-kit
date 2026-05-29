export const emailTemplates = [
  "welcome",
  "upgrade",
  "trial-ending",
  "waitlist-confirmation",
  "waitlist-admin-notification",
] as const;

export type EmailTemplateName = (typeof emailTemplates)[number];

export * from "./utils";
export * from "./welcome";
export * from "./billing";
export * from "./waitlist";
