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
