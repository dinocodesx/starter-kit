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

export function createFullAuthStack(options: FullAuthStackOptions): FullAuthStack {
  const authEnv = readAuthEnvironment({
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? options.defaultBaseURL,
  });

  const appName = options.appName ?? process.env.APP_NAME ?? "your workspace";

  const emailEnv = readEmailEnvironment({
    ...process.env,
    APP_NAME: process.env.APP_NAME ?? appName,
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
