/**
 * Arabic message catalogue — the only user-facing strings in the app.
 *
 * Arabic is the only shipped locale (see docs/DECISIONS.md §1). This file is
 * the seam that keeps that decision cheap to revisit: adding a locale means
 * adding a sibling catalogue with the same keys, not hunting literals across
 * components. Nothing user-facing is written inline in a component.
 *
 * **Register: white Saudi dialect**, not Modern Standard Arabic — the app talks
 * the way its user talks (docs/DECISIONS.md). Three deliberate exceptions,
 * because dialect buys warmth and spends clarity, and these three cannot afford
 * to spend it:
 *
 *   1. Errors, and anything about the safety of the account, stay short and
 *      plain. Dialect lengthens a sentence, and a long error is a skipped one.
 *   2. Nutrition terms stay as they are (بروتين · كارب · دهون · سعرة). They are
 *      the words printed on the packet.
 *   3. The medical disclaimer stays serious. Legal wording in dialect reads as
 *      if it were not meant, which is the opposite of its purpose.
 *
 * Above all of it, DECISIONS amendment 6 still holds: nothing here blames the
 * reader. Dialect makes warmth easy and makes flippancy just as easy, and the
 * distance between them matters in an app about somebody's body.
 *
 * Keys are namespaced `area.thing`. Placeholders are `{name}`.
 */
export const ar = {
  "app.name": "NUTRIVA",
  // English on purpose: the wordmark and this line are one brand lockup, and
  // the home page renders it as such — it is not interface copy, and every
  // actual sentence the app says is Arabic. The page description in layout.tsx
  // reads `home.body` instead of this, so search results and share cards reach
  // an Arabic reader in Arabic.
  "app.tagline": "your daily nutrition, made simple.",

  // ── الصفحة الرئيسية ──────────────────────────────────────────────────────
  "home.heading": "تابع سعراتك بدون تعقيد",
  "home.body":
    "دخّل معلوماتك مرة وحدة، ويطلع لك هدف يومي محسوب لك. بعدها سجّل أكلك بثواني وتعرف كم باقي لك.",
  "home.cta": "ابدأ",
  "home.signIn": "عندك حساب؟ سجّل دخولك",

  // ── المصادقة ─────────────────────────────────────────────────────────────
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة السر",
  "auth.passwordHint": "٨ حروف على الأقل.",

  "auth.login.title": "سجّل دخولك",
  "auth.login.submit": "دخول",
  "auth.login.pending": "لحظة… نسجّل دخولك",
  "auth.login.forgot": "ناسي كلمة السر؟",
  "auth.login.noAccount": "ما عندك حساب؟",
  "auth.login.createOne": "سوِّ لك حساب",

  "auth.register.title": "حساب جديد",
  "auth.register.submit": "سجّلني",
  "auth.register.pending": "لحظة… نسوّي حسابك",
  "auth.register.haveAccount": "عندك حساب من قبل؟",
  "auth.register.signIn": "سجّل دخولك",

  // No `auth.checkEmail.*` here: email confirmation is off, so a new account is
  // signed in immediately and never sees a "check your inbox" screen. The
  // messages that screen used were removed with it — restore them from git
  // history if confirmation comes back.

  "auth.forgot.title": "استرجاع كلمة السر",
  "auth.forgot.body": "دخّل بريدك ونرسل لك رابط تسوّي فيه كلمة سر جديدة.",
  "auth.forgot.submit": "أرسل الرابط",
  "auth.forgot.pending": "لحظة… نرسل الرابط",
  // Deliberately says nothing about whether the address has an account.
  "auth.forgot.sent": "لو هذا البريد له حساب عندنا، وصله رابط إعادة التعيين الحين.",
  "auth.forgot.backToLogin": "ارجع لتسجيل الدخول",

  "auth.reset.title": "كلمة سر جديدة",
  "auth.reset.submit": "احفظ كلمة السر",
  "auth.reset.pending": "لحظة… نحفظ",
  "auth.reset.newPassword": "كلمة السر الجديدة",

  "auth.logout": "تسجيل الخروج",

  // ── الملف الشخصي ─────────────────────────────────────────────────────────
  "profile.title": "حسابي",
  "profile.displayName": "اسمك",
  "profile.displayNameHint": "اختياري، وما يشوفه غيرك. خلّه فاضي ويظهر بريدك بداله.",
  "profile.save": "احفظ",
  "profile.pending": "لحظة… نحفظ",
  "profile.saved": "انحفظ اسمك.",
  "profile.accountSection": "الحساب",
  "profile.signedInAs": "داخل بـ {email}",

  // Deletion is irreversible, so this block says exactly what goes, and dialect
  // does not get to soften it.
  "profile.delete.title": "حذف الحساب",
  "profile.delete.body":
    "يحذف حسابك وكل بياناتك نهائياً: أهدافك وسجل أكلك وسجل وزنك. ما فيه رجعة بعدها.",
  "profile.delete.confirmLabel": "اكتب {word} عشان نتأكد",
  "profile.delete.confirmWord": "حذف",
  "profile.delete.submit": "احذف حسابي نهائياً",
  "profile.delete.pending": "لحظة… نحذف",
  "profile.delete.mismatch": "الكلمة ما تطابقت، وما انحذف شي.",

  // ── التحقق من المدخلات ───────────────────────────────────────────────────
  "field.emailInvalid": "دخّل بريد إلكتروني صحيح.",
  "field.passwordRequired": "دخّل كلمة السر.",
  "field.passwordTooShort": "كلمة السر ٨ حروف على الأقل.",
  "field.passwordTooLong": "كلمة السر طويلة زيادة. جرّب وحدة أقصر.",
  "field.displayNameTooLong": "الاسم ٦٠ حرف كحد أقصى.",

  // ── مدخلات حساب الهدف ────────────────────────────────────────────────────
  // One message per value of `InputIssue` in features/nutrition/domain/types.ts.
  // The bounds are written into the sentences rather than passed in as
  // placeholders, exactly as the password rules above are: every other message
  // in this file reads that way, and a bound that moves gets its sentence
  // reread anyway.
  "field.ageBelowMinimum": "التطبيق لمن عمره ١٦ سنة فأكثر.",
  "field.ageImplausible": "سنة الميلاد ما تبدو صحيحة. راجعها.",
  "field.heightOutOfRange": "دخّل طول بين ٩٠ و٢٥٠ سم.",
  "field.weightOutOfRange": "دخّل وزن بين ٢٠ و٤٠٠ كجم.",
  "field.targetWeightRequired": "دخّل الوزن اللي تبيه.",
  "field.targetWeightOutOfRange": "الوزن اللي تبيه لازم يكون بين ٢٠ و٤٠٠ كجم.",
  "field.customRateRequired": "دخّل كم تبي تغيّر في الأسبوع.",
  "field.customRateOutOfRange": "أقصى معدّل كيلو واحد في الأسبوع، نزول أو زيادة.",

  // ── تعديلات الحساب ───────────────────────────────────────────────────────
  // One message per value of `AdjustmentReason`. The engine never returns a
  // number it had to change without saying which and why; these are the sentences
  // that carry that "why" to the user. They are written to state what was done
  // and the reason for it — not to fault the person for the answer they gave.
  "adjustment.deficitCapped":
    "رفعنا هدفك لأكبر عجز نسمح فيه. النزول أسرع من كذا ياخذ من عضلاتك، ويصعب تكمّل عليه.",
  "adjustment.surplusCapped":
    "نزّلنا هدفك لأكبر زيادة نسمح فيها. اللي فوقها يتحوّل دهون أكثر ما يبني عضل.",
  "adjustment.calorieFloorApplied":
    "رفعنا هدفك لأقل كمية يومية يُنصح فيها بدون إشراف مختص، لأن الحساب كان ينزل تحتها.",
  "adjustment.macrosRebalanced":
    "الهدف ما وسّع للكمية المفضّلة من البروتين والدهون مع بعض، فقرّبناهم لها بالتساوي.",
  "adjustment.macrosBelowFloor":
    "هذا الهدف ما يغطي أقل كمية من البروتين والدهون، فما بقي شي للكربوهيدرات. راجع معلوماتك، ولو كانت صحيحة استشر مختص تغذية.",
  "adjustment.targetWeightUnderweight":
    "الوزن اللي اخترته أقل من النطاق الصحي لطولك. ما غيّرنا أرقامك، ونقترح تراجع مختص قبل ما تمشي عليه.",

  // ── الأخطاء ──────────────────────────────────────────────────────────────
  // Short and plain on purpose — see the note at the top of this file.
  "error.generic": "ما ضبطت العملية. حاول مرة ثانية.",
  "error.invalidCredentials": "البريد أو كلمة السر غلط.",
  "error.emailNotConfirmed": "فعّل حسابك أول من رابط التأكيد اللي في بريدك.",
  "error.emailExists": "هذا البريد مسجّل عندنا. جرّب تسجّل دخولك.",
  "error.weakPassword": "كلمة السر ضعيفة. اختر وحدة أطول أو أقل شهرة.",
  "error.samePassword": "كلمة السر الجديدة نفس القديمة.",
  "error.expiredLink": "الرابط انتهت صلاحيته. اطلب رابط جديد.",
  "error.rateLimited": "محاولات كثيرة بوقت قصير. استنّ شوي وعاود.",
  "error.invalidInput": "فيه بيانات غير صحيحة. راجعها وعاود.",
  "error.duplicate": "هذا العنصر موجود من قبل.",
  "error.notAllowed": "ما عندك صلاحية على هذا العنصر.",
  "error.sessionExpired": "انتهت جلستك. سجّل دخولك من جديد.",
} as const;
