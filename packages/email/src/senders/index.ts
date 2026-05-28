import { Resend } from "resend";

/**
 * Creates and returns a configured Resend API client.
 *
 * The guard against an empty `apiKey` is intentionally omitted here because
 * `createEmailService` — the public-facing factory — validates the key before
 * this function is ever called. Keeping the validation in one place avoids
 * conflicting error messages.
 */
export function createResendClient(apiKey: string) {
  return new Resend(apiKey);
}
