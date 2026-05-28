import { prisma, createPrismaDeliveryStore } from "@creator-suite/db";
import { createEmailService, readEmailEnvironment } from "@creator-suite/email";
import type { EmailService } from "@creator-suite/email";
import { createAuth } from "./server/index";
import { readAuthEnvironment } from "./config/index";

export interface FullAuthStackOptions {
  defaultBaseURL: string;
  appName?: string;
}

export interface FullAuthStack {
  auth: ReturnType<typeof createAuth>;
  emailService: EmailService;
}

/**
 * Bootstraps the complete authentication and email stack for a single
 * application entry-point.
 *
 * This is the preferred way to wire up auth in any app in the monorepo — it
 * reads all required environment variables, constructs the Prisma-backed email
 * delivery store, and connects the email service to the auth hook that fires
 * when a new user is created.
 *
 * What it does, step by step:
 * 1. Reads and validates auth environment variables (`BETTER_AUTH_URL`,
 *    `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
 *    `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`).
 *    `options.defaultBaseURL` is used as a fallback when `BETTER_AUTH_URL` is
 *    not set in the environment (useful in development).
 * 2. Resolves `appName` — prefers `options.appName`, then `APP_NAME` from the
 *    environment, then falls back to `"your workspace"`.
 * 3. Reads and validates email environment variables (`RESEND_API_KEY`,
 *    `RESEND_FROM_ADDRESS`), injecting the already-resolved `appName` so both
 *    services use the exact same value.
 * 4. Creates the `EmailService` backed by a Prisma delivery store.
 * 5. Creates the Better Auth instance and registers a `databaseHooks.user.create.after`
 *    callback that fires `emailService.sendWelcomeEmail` for every new user.
 *
 * @returns `{ auth, emailService }` — both are ready to use immediately.
 */
export function createFullAuthStack(options: FullAuthStackOptions): FullAuthStack {
  const authEnv = readAuthEnvironment({
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? options.defaultBaseURL,
  });

  const appName = options.appName ?? process.env.APP_NAME ?? "your workspace";

  const emailEnv = readEmailEnvironment({
    ...process.env,
    APP_NAME: appName,
  });

  const emailService = createEmailService({
    store: createPrismaDeliveryStore(prisma),
    resendApiKey: emailEnv.resendApiKey,
    fromAddress: emailEnv.fromAddress,
    appName: emailEnv.appName,
  });

  const auth = createAuth({
    prisma,
    baseURL: authEnv.baseURL,
    secret: authEnv.secret,
    googleClientId: authEnv.googleClientId,
    googleClientSecret: authEnv.googleClientSecret,
    appleClientId: authEnv.appleClientId,
    appleClientSecret: authEnv.appleClientSecret,
    appName,
    onUserCreated: async (user) => {
      await emailService.sendWelcomeEmail({
        email: user.email,
        userId: user.id,
        name: user.name,
      });
    },
  });

  return { auth, emailService };
}
