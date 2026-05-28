import { createAuthClient as createBetterAuthClient } from "better-auth/react";

/**
 * Creates a Better Auth client configured for a specific application.
 * Each app in the monorepo must call this with its own baseURL.
 *
 * @example
 * // apps/studio/src/lib/auth-client.ts
 * import { createAuthClient } from "@creator-suite/auth";
 * export const authClient = createAuthClient({ baseURL: "http://localhost:3000" });
 */
export const createAuthClient = createBetterAuthClient;
