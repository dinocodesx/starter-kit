import { Resend } from "resend";

export const mailerProviders = ["resend"] as const;

export type MailerProvider = (typeof mailerProviders)[number];

export function getMailerProvider() {
  return "resend" as const;
}

export function createResendClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to create the Resend client.");
  }

  return new Resend(apiKey);
}
