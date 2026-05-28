import type { WorkspaceRole } from "../roles/index.js";

/**
 * Narrows a nullable session value to a guaranteed non-null session.
 *
 * Throws an `Error` with `message` (defaults to `"Authentication required."`)
 * if `session` is `null` or `undefined`. This is intended to be used at the
 * top of server actions or API route handlers to enforce authentication in a
 * single, readable line before accessing session data.
 *
 * @example
 * const session = assertAuthenticated(await getServerSession());
 * // session is now typed as TSession — null/undefined are excluded.
 */
export function assertAuthenticated<TSession>(
  session: TSession | null | undefined,
  message = "Authentication required.",
) {
  if (!session) {
    throw new Error(message);
  }

  return session;
}

/**
 * Returns `true` if the given role has write access to a workspace.
 *
 * Only `"owner"` and `"editor"` can mutate workspace resources; `"viewer"`
 * is read-only. Use this before any server action or mutation that modifies
 * workspace data.
 *
 * The parameter is typed as `WorkspaceRole` (the full union) rather than
 * `string` so TypeScript enforces that callers narrow unknown role strings
 * from external data before passing them in.
 */
export function canManageWorkspace(role: WorkspaceRole) {
  return role === "owner" || role === "editor";
}
