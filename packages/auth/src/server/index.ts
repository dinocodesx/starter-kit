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
  appleClientId: string;
  appleClientSecret: string;
  appName?: string;
  onUserCreated?: (user: WelcomeEmailUser) => Promise<void>;
}

/**
 * Derives the list of trusted origins from the application's base URL.
 *
 * Better Auth uses this list to validate the `Origin` header on incoming
 * requests and to restrict which domains are allowed to make authenticated
 * cross-origin requests. Extracting only the origin (scheme + host + port)
 * from `baseURL` ensures subpaths are not included.
 *
 * Example: `"https://app.example.com/dashboard"` → `["https://app.example.com"]`
 */
function getTrustedOrigins(baseURL: string) {
  return [new URL(baseURL).origin];
}

/**
 * Initialises and returns a Better Auth instance for the application.
 *
 * Configures:
 * - **Database** — Prisma adapter backed by PostgreSQL, using the provided
 *   `PrismaClient`.
 * - **Google OAuth** — the `select_account` prompt is set so users who have
 *   multiple Google accounts can always choose which one to use.
 * - **Apple OAuth** — configured with Service ID as `clientId` and standard client secret.
 * - **Trusted origins** — derived from `baseURL` to prevent CSRF.
 * - **Post-creation hook** — if `onUserCreated` is supplied, it is called
 *   asynchronously after a new user row is inserted. Errors from the hook are
 *   caught and logged so they never block the sign-up response.
 */
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
      apple: {
        clientId: options.appleClientId,
        clientSecret: options.appleClientSecret,
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
