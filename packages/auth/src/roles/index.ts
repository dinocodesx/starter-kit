export const workspaceRoles = ["owner", "editor", "viewer"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];
