/**
 * Public environment values, read once and checked at module load.
 *
 * Both are `NEXT_PUBLIC_`, so Next inlines them at BUILD time. A missing value
 * therefore is not a runtime outage you can fix by setting a variable on the
 * host — it is a bad build that has to be rebuilt. Failing loudly here, at
 * import, turns that into one obvious error instead of a scattering of
 * "Invalid URL" and "No API key found" messages from deep inside the Supabase
 * client on whichever page happened to load first.
 *
 * Neither value is a secret. The publishable key is meant to ship in the client
 * bundle; row-level security, not key secrecy, is what protects user data.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in from the ` +
        `Supabase dashboard. On a host, set it and rebuild — these values are ` +
        `inlined at build time, so a cached redeploy keeps the old ones.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

/**
 * The site's own origin, used to build the links that go into confirmation and
 * password-reset emails.
 *
 * Deliberately configured rather than derived from the request's Host header.
 * A Host header is attacker-controlled: send a password-reset request with
 * `Host: evil.test` and the victim receives a real email from the real service
 * containing a link that hands their reset token to the attacker. Supabase's
 * redirect allow-list is a second line of defence, not a reason to skip this.
 */
export const SITE_URL = required(
  "NEXT_PUBLIC_SITE_URL",
  process.env.NEXT_PUBLIC_SITE_URL,
).replace(/\/$/, "");
