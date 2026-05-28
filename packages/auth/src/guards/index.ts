export function canManageWorkspace(role: string) {
  return role === "owner" || role === "editor";
}
