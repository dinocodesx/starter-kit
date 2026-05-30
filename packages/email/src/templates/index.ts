export const emailTemplates = [
  "welcome",
  "upgrade",
  "trial-ending",
  "waitlist-confirmation",
  "waitlist-admin-notification",
  "login",
  "logout",
  "changelog",
  "invoice",
  "access-invitation",
] as const;

export type EmailTemplateName = (typeof emailTemplates)[number];

export * from "./utils";
export * from "./welcome";
export * from "./billing";
export * from "./waitlist";
export * from "./auth";
export * from "./changelog";
export * from "./invoice";
export * from "./access";
