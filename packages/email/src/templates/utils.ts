/**
 * Escapes the five characters that have special meaning in HTML so that
 * user-supplied strings can be safely interpolated into HTML email bodies
 * without risk of XSS or broken markup.
 *
 * Replaces: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`,
 *           `"` → `&quot;`, `'` → `&#39;`.
 */
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
