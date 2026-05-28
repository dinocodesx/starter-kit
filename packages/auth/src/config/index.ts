import { z } from "zod";

const authEnvironmentSchema = z.object({
  baseURL: z.string().url(),
  secret: z.string().min(1),
  googleClientId: z.string().min(1),
  googleClientSecret: z.string().min(1),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

export function readAuthEnvironment(env: NodeJS.ProcessEnv = process.env): AuthEnvironment {
  const result = authEnvironmentSchema.safeParse({
    baseURL: env.BETTER_AUTH_URL ?? env.AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
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
} as const;
