import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import type { PrismaClient } from "@creator-suite/db";
import { authConfig } from "../config/index";

export interface WelcomeEmailUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
}

export interface CreateAuthOptions {
  prisma: PrismaClient;
  baseURL: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  appName?: string;
  onUserCreated?: (user: WelcomeEmailUser) => Promise<void>;
}

function getTrustedOrigins(baseURL: string) {
  return [new URL(baseURL).origin];
}

export function createAuth(options: CreateAuthOptions) {
  const appName = options.appName ?? "your workspace";

  return betterAuth({
    appName,
    baseURL: options.baseURL,
    secret: options.secret,
    trustedOrigins: getTrustedOrigins(options.baseURL),
    database: prismaAdapter(options.prisma, {
      provider: "postgresql",
    }),
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        prompt: "select_account",
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (options.onUserCreated) {
              void options.onUserCreated({
                id: user.id,
                email: user.email,
                name: user.name ?? null,
                image: user.image ?? null,
              }).catch((error: unknown) => {
                console.error("[auth] onUserCreated hook failed", error);
              });
            }
          },
        },
      },
    },
  });
}

export const betterAuthConfig = authConfig;
