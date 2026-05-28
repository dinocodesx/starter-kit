import { z } from "zod";

const authEnvironmentSchema = z.object({
  baseURL: z.string().url(),
  secret: z.string().min(1),
  googleClientId: z.string().min(1),
  googleClientSecret: z.string().min(1),
  appleClientId: z.string().min(1),
  appleClientSecret: z.string().min(1),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

/**
 * Reads and validates the auth-related environment variables required to
 * initialise Better Auth.
 *
 * Parses the following variables from `env` (defaults to `process.env`):
 * - `BETTER_AUTH_URL` / `AUTH_URL` — required; the canonical base URL of the
 *   application (used to build callback URLs). `BETTER_AUTH_URL` takes
 *   precedence when both are set.
 * - `BETTER_AUTH_SECRET`           — required; the secret used to sign session
 *   tokens and other cryptographic primitives.
 * - `GOOGLE_CLIENT_ID`             — required; the OAuth 2.0 client ID for
 *   Google sign-in.
 * - `GOOGLE_CLIENT_SECRET`         — required; the OAuth 2.0 client secret for
 *   Google sign-in.
 * - `APPLE_CLIENT_ID`              — required; the client ID (Service ID) for
 *   Apple sign-in.
 * - `APPLE_CLIENT_SECRET`          — required; the client secret for Apple sign-in.
 *
 * Throws an `Error` listing all validation failures if any required variable
 * is missing or malformed, so misconfigured environments fail fast at startup.
 */
export function readAuthEnvironment(env: NodeJS.ProcessEnv = process.env): AuthEnvironment {
  const result = authEnvironmentSchema.safeParse({
    baseURL: env.BETTER_AUTH_URL ?? env.AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    appleClientId: env.APPLE_CLIENT_ID,
    appleClientSecret: env.APPLE_CLIENT_SECRET,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Invalid auth environment configuration: ${errors}`);
  }

  return result.data;
}

export const authConfig = {
  provider: "better-auth",
  basePath: "/api/auth",
  googleProvider: "google",
  appleProvider: "apple",
} as const;
