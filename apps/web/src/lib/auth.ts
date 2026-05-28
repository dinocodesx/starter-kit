import { createFullAuthStack } from "@creator-suite/auth";

export const { auth, emailService } = createFullAuthStack({
  defaultBaseURL: "http://localhost:4321",
});
