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

  // ── الصفحة الرئيسية ──────────────────────────────────────────────────────
  "home.heading": "تتبّع سعراتك بلا تعقيد",
  "home.body":
    "أدخل معلوماتك مرة واحدة، فتحصل على هدف يومي محسوب لك، ثم سجّل طعامك في ثوانٍ وتابع ما تبقّى لك.",
  "home.cta": "ابدأ",
  "home.signIn": "لديك حساب؟ سجّل الدخول",

  // ── المصادقة ─────────────────────────────────────────────────────────────
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.passwordHint": "٨ أحرف على الأقل.",

  "auth.login.title": "تسجيل الدخول",
  "auth.login.submit": "دخول",
  "auth.login.pending": "جارٍ الدخول…",
  "auth.login.forgot": "نسيت كلمة المرور؟",
  "auth.login.noAccount": "ليس لديك حساب؟",
  "auth.login.createOne": "أنشئ حساباً",

  "auth.register.title": "إنشاء حساب",
  "auth.register.submit": "إنشاء الحساب",
  "auth.register.pending": "جارٍ الإنشاء…",
  "auth.register.haveAccount": "لديك حساب بالفعل؟",
  "auth.register.signIn": "سجّل الدخول",

  "auth.checkEmail.title": "أرسلنا لك رسالة",
  // The address is deliberately not repeated here: it would have to travel in
  // the URL to get to this page, and personal data does not belong in a query
  // string that lands in history, logs and referrer headers.
  "auth.checkEmail.body":
    "افتح الرسالة التي أرسلناها إلى بريدك واضغط رابط التأكيد لتفعيل حسابك. لو لم تجدها، تحقّق من مجلد البريد غير المرغوب.",

  "auth.forgot.title": "استعادة كلمة المرور",
  "auth.forgot.body": "أدخل بريدك وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.",
  "auth.forgot.submit": "أرسل الرابط",
  "auth.forgot.pending": "جارٍ الإرسال…",
  // Deliberately says nothing about whether the address has an account.
  "auth.forgot.sent":
    "إن كان لهذا البريد حساب لدينا، فقد أرسلنا إليه رابط إعادة التعيين الآن.",
  "auth.forgot.backToLogin": "العودة لتسجيل الدخول",

  "auth.reset.title": "كلمة مرور جديدة",
  "auth.reset.submit": "احفظ كلمة المرور",
  "auth.reset.pending": "جارٍ الحفظ…",
  "auth.reset.newPassword": "كلمة المرور الجديدة",

  "auth.logout": "تسجيل الخروج",

  // ── الملف الشخصي ─────────────────────────────────────────────────────────
  "profile.title": "حسابي",
  "profile.displayName": "اسم العرض",
  "profile.displayNameHint": "اختياري، ويظهر لك وحدك. اتركه فارغاً ليُعرض بريدك.",
  "profile.save": "حفظ",
  "profile.pending": "جارٍ الحفظ…",
  "profile.saved": "حُفظ اسم العرض.",
  "profile.accountSection": "الحساب",
  "profile.signedInAs": "مسجَّل الدخول بـ {email}",

  "profile.delete.title": "حذف الحساب",
  "profile.delete.body":
    "يحذف حسابك وكل بياناتك حذفاً نهائياً: أهدافك وسجل طعامك وسجل وزنك. لا يمكن التراجع عن هذا.",
  "profile.delete.confirmLabel": "اكتب {word} للتأكيد",
  "profile.delete.confirmWord": "حذف",
  "profile.delete.submit": "احذف حسابي نهائياً",
  "profile.delete.pending": "جارٍ الحذف…",
  "profile.delete.mismatch": "الكلمة غير مطابقة، فلم يُحذف شيء.",

  // ── التحقق من المدخلات ───────────────────────────────────────────────────
  "field.emailInvalid": "أدخل بريداً إلكترونياً صحيحاً.",
  "field.passwordRequired": "أدخل كلمة المرور.",
  "field.passwordTooShort": "كلمة المرور ٨ أحرف على الأقل.",
  "field.passwordTooLong": "كلمة المرور طويلة جداً. جرّب كلمة أقصر.",
  "field.displayNameTooLong": "اسم العرض ٦٠ حرفاً كحد أقصى.",

  // ── الأخطاء ──────────────────────────────────────────────────────────────
  "error.generic": "تعذّر إتمام العملية. حاول مرة أخرى.",
  "error.invalidCredentials": "البريد أو كلمة المرور غير صحيحة.",
  "error.emailNotConfirmed": "فعّل حسابك أولاً من رابط التأكيد المُرسَل إلى بريدك.",
  "error.emailExists": "هذا البريد مسجَّل لدينا. جرّب تسجيل الدخول.",
  "error.weakPassword": "كلمة المرور ضعيفة. اختر كلمة أطول أو أقل شيوعاً.",
  "error.samePassword": "كلمة المرور الجديدة مطابقة للقديمة.",
  "error.expiredLink": "انتهت صلاحية الرابط. اطلب رابطاً جديداً.",
  "error.rateLimited": "محاولات كثيرة في وقت قصير. انتظر قليلاً ثم أعد المحاولة.",
  "error.invalidInput": "بعض البيانات غير صالحة. راجعها ثم أعد المحاولة.",
  "error.duplicate": "هذا العنصر موجود مسبقاً.",
  "error.notAllowed": "ليست لديك صلاحية على هذا العنصر.",
  "error.sessionExpired": "انتهت جلستك. سجّل الدخول من جديد.",
} as const;
