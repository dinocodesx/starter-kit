import { Resend } from "resend";

export function createResendClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to create the Resend client.");
  }

  return new Resend(apiKey);
}
