import { ar } from "./ar";

/** Locales the app ships. Arabic only today — see docs/DECISIONS.md §1. */
export type Locale = "ar";

export const DEFAULT_LOCALE: Locale = "ar";

/** Text direction per locale. Read by the root layout, not hard-coded there. */
export const DIRECTION: Record<Locale, "rtl" | "ltr"> = { ar: "rtl" };

const CATALOGUES = { ar } as const;

export type Messages = typeof ar;
export type MessageKey = keyof Messages;

/** Values substituted into `{placeholder}` slots. */
export type MessageVars = Record<string, string | number>;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Look up a message and fill its placeholders.
 *
 * Keys are typed, so a missing key is a compile error for any normal call site.
 * The runtime fallback exists for the paths types cannot cover (a key built from
 * data): it returns the key itself and logs, because a visible key in the UI is
 * a far better failure than a thrown error that blanks the screen.
 *
 * A placeholder with no matching variable is left intact for the same reason —
 * `{n}` on screen tells you exactly what is missing.
 */
export function translate(
  key: MessageKey,
  vars?: MessageVars,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const template = CATALOGUES[locale][key] as string | undefined;

  if (template === undefined) {
    console.error(`[i18n] missing message "${key}" in locale "${locale}"`);
    return key;
  }

  if (!vars) return template;

  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Bind `translate` to one locale. Components call `const t = useMessages()`
 * so the locale never leaks into call sites — which is what makes adding a
 * second locale a change here rather than everywhere.
 */
export function getMessages(locale: Locale = DEFAULT_LOCALE) {
  return (key: MessageKey, vars?: MessageVars) => translate(key, vars, locale);
}
