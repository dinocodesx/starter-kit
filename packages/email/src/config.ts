import { z } from "zod";

const emailEnvironmentSchema = z.object({
  resendApiKey: z.string().min(1, "RESEND_API_KEY must not be empty"),
  fromAddress: z
    .string()
    .min(1)
    .default("Onboarding <onboarding@resend.dev>"),
  appName: z.string().min(1).default("your workspace"),
});

export type EmailEnvironment = z.infer<typeof emailEnvironmentSchema>;

/**
 * Reads and validates the email-related environment variables required to
 * configure the email service.
 *
 * Parses the following variables from `env` (defaults to `process.env`):
 * - `RESEND_API_KEY`      — required; the Resend API key used to send emails.
 * - `RESEND_FROM_ADDRESS` — optional; the "from" address shown in outgoing
 *   emails. Defaults to `"Onboarding <onboarding@resend.dev>"`.
 * - `APP_NAME`            — optional; the human-readable workspace or product
 *   name used in email copy. Defaults to `"your workspace"`.
 *
 * Throws an `Error` listing all validation failures if any required variable
 * is missing or malformed, so misconfigured environments fail fast at startup
 * rather than at send time.
 */
export function readEmailEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): EmailEnvironment {
  const result = emailEnvironmentSchema.safeParse({
    resendApiKey: env.RESEND_API_KEY,
    fromAddress: env.RESEND_FROM_ADDRESS,
    appName: env.APP_NAME,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Invalid email environment configuration: ${errors}`);
  }

  return result.data;
}
