import type { WorkspaceRole } from "../roles/index.js";

export function assertAuthenticated<TSession>(
  session: TSession | null | undefined,
  message = "Authentication required.",
) {
  if (!session) {
    throw new Error(message);
  }

  return session;
}

export function canManageWorkspace(role: WorkspaceRole | string) {
  return role === "owner" || role === "editor";
}
