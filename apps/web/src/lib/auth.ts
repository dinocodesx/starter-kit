import { createFullAuthStack } from "@creator-suite/auth/integration";

export const { auth, emailService } = createFullAuthStack({
  defaultBaseURL: "http://localhost:4321",
});
