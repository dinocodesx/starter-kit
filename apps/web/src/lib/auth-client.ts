import { createAuthClient } from "@creator-suite/auth";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4321",
});
