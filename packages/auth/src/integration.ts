import { prisma } from "@creator-suite/db";
import { createEmailService } from "@creator-suite/email";
import { createAuth } from "./server/index.js";
import { readAuthEnvironment } from "./config/index.js";

export interface FullAuthStackOptions {
  defaultBaseURL: string;
  appName?: string;
}

export function createFullAuthStack(options: FullAuthStackOptions) {
  const authEnv = readAuthEnvironment({
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? options.defaultBaseURL,
  });

  const appName = options.appName ?? process.env.APP_NAME ?? "your workspace";

  const emailService = createEmailService({
    prisma,
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    fromAddress:
      process.env.RESEND_FROM_ADDRESS ?? "Onboarding <onboarding@resend.dev>",
    appName,
  });

  const auth = createAuth({
    prisma,
    baseURL: authEnv.baseURL,
    secret: authEnv.secret,
    googleClientId: authEnv.googleClientId,
    googleClientSecret: authEnv.googleClientSecret,
    appName,
    sendWelcomeEmail: async ({ user }) => {
      await emailService.sendWelcomeEmail({
        email: user.email,
        userId: user.id,
        name: user.name,
      });
    },
  });

  return { auth, emailService };
}
