/**
 * Arabic message catalogue — the only user-facing strings in the app.
 *
 * Arabic is the only shipped locale (see docs/DECISIONS.md §1). This file is
 * the seam that keeps that decision cheap to revisit: adding a locale means
 * adding a sibling catalogue with the same keys, not hunting literals across
 * components. Nothing user-facing is written inline in a component.
 *
 * Keys are namespaced `area.thing`. Placeholders are `{name}`.
 */
export const ar = {
  "app.name": "kcal",
  "app.tagline": "اعرف كم تبقّى لك اليوم، بأقل عدد من الضغطات.",

  "home.heading": "تتبّع سعراتك بلا تعقيد",
  "home.body":
    "أدخل معلوماتك مرة واحدة، فتحصل على هدف يومي محسوب لك، ثم سجّل طعامك في ثوانٍ وتابع ما تبقّى لك.",
  "home.cta": "ابدأ",
  "home.buildStatus": "قيد التطوير — المرحلة {phase} من {total}",

  "common.retry": "أعد المحاولة",
  "common.cancel": "إلغاء",
} as const;
