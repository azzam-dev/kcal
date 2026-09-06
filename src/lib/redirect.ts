/**
 * Sanitises a post-sign-in redirect target taken from the query string.
 *
 * `/login?next=…` is attacker-controllable: anyone can send a user a link with
 * any value in it. Redirecting to it unchecked is an open redirect — the user
 * signs in on the real site and lands on an attacker's page that looks like a
 * continuation of the flow. Only same-site absolute paths are allowed through.
 *
 * Rejected, with the reason each one matters:
 *   https://evil.test  absolute URL to another origin
 *   //evil.test        protocol-relative; the browser reads this as an origin
 *   /\evil.test        some parsers normalise the backslash into a second slash
 *   dashboard          relative path; resolves against whatever the current URL
 *                      happens to be, so the destination is not knowable here
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.startsWith("/\t") || value.startsWith("/\n") || value.startsWith("/\r")) {
    return fallback;
  }
  return value;
}
