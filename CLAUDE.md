# kcal

تطبيق ويب عربي، جوال-أولاً، لتتبع السعرات والعناصر الغذائية الكبرى.

**المراحل ٠١–٠٣ من ١٢ مكتملة.** اقرأ [PROGRESS.md](./PROGRESS.md) لحالة العمل،
و[docs/PLAN.md](./docs/PLAN.md) للخطة، و[docs/DECISIONS.md](./docs/DECISIONS.md) للقرارات
ومبرراتها. هذا الملف يصف **الأعراف المتّبعة فعلاً في الكود القائم** — لا المستهدفة.

## Stack

- Next.js 16.3.4 (App Router، Turbopack افتراضياً)، React 19.2.8، TypeScript 5.9 (`strict`
  + `noUncheckedIndexedAccess`)
- Tailwind CSS v4 — التوكنز في `@theme` داخل `src/app/globals.css`، **لا ملف `tailwind.config.*`**
- Supabase: Postgres + Auth + RLS. مشروع حي، ref `xwmnvwveoxgajyzbbsja` (فرانكفورت
  `eu-central-1`). الـCLI كـdevDependency (`npx supabase`).
- Zod 4 للتحقق، Vitest 5 للاختبارات
- ESLint **9.39.5 مثبَّت عمداً** — انظر "Don't"

## الأوامر

```bash
npm run dev        # Turbopack على المنفذ 3001
npm run build      # لا يشغّل ESLint (Next 16 أسقطت ذلك)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest run

npm run db:push    # يطبّق migrations غير المطبَّقة على المشروع المربوط
npm run db:types   # يعيد توليد src/lib/database.types.ts
```

الخمسة الأولى **عدا** `dev` هي بوابة CI. **البناء الناجح وحده لا يعني أن اللينت نظيف.**

**على ويندوز/PowerShell:** سياسة `Restricted` تمنع `npm.ps1` و`npx.ps1`. استعمل
`npm.cmd` و`npx.cmd`، أو Git Bash.

**المنفذ 3001 مثبَّت في سكربت `dev` عمداً:** يجب أن يطابق `NEXT_PUBLIC_SITE_URL`، وإلا
أشارت روابط البريد إلى منفذ لا يعمل.

## المجلدات القائمة

```
src/app/globals.css       التوكنز في @theme + قواعد عامة (focus-visible، .nums)
src/app/layout.tsx        <html lang="ar" dir="rtl"> + الخط، كلها من src/i18n لا مكتوبة يدوياً
src/app/page.tsx          الصفحة العامة
src/app/(auth)/           layout + login · register · check-email · forgot-password
                            · reset-password، وactions.ts فيه كل server actions المصادقة
src/app/(app)/            layout الشريط العلوي + profile (اسم العرض، حذف الحساب)
src/app/auth/confirm/     Route Handler يستبدل رمز الرابط المُرسَل بالبريد بجلسة
src/proxy.ts              بوابة الجلسة (اصطلاح Next 16، وليس middleware.ts)
src/components/ui.tsx     Button · Card · Field · Alert — البدائل الأربعة الوحيدة
src/i18n/ar.ts            قاموس الرسائل العربي — كل نص يراه المستخدم
src/i18n/index.ts         Locale · DIRECTION · translate() · getMessages()
src/lib/env.ts            متغيرات البيئة، مفحوصة عند الاستيراد
src/lib/errors.ts         رمز خطأ Supabase ← مفتاح رسالة
src/lib/redirect.ts       safeRedirectPath — حماية من open redirect
src/lib/supabase/         client (متصفح) · server (خادم) · session (منطق البوابة)
src/lib/validation/       سكيمات Zod + issueKey
src/lib/database.types.ts مولَّد — لا يُحرَّر يدوياً. أعِد توليده بـnpm run db:types
src/lib/database-contract.test.ts  يحرس تطابق أنواع الدومين مع enums القاعدة
src/features/nutrition/domain/   محرك الحساب — تايبسكربت نقي، لا React ولا Supabase
                                   types · bmr · tdee · goal · macros · index
src/server/profile.ts     استعلامات profiles، بلا قواعد عمل
tests/integration/rls/    اختبارات عزل المستخدمين — تحتاج مشروعاً حياً ومفتاح service_role
supabase/migrations/      مصدر الحقيقة للـschema
```

**لا تُنشئ مجلداً قبل أن تملأه.** `src/features/food` و`logging` و`weight` و`insights`
مخطَّطة في PLAN.md ولم تُنشأ بعد.

## Conventions المتّبعة فعلاً

- **كل نص يراه المستخدم يمر عبر `src/i18n/ar.ts`.** لا نص عربي مكتوب داخل مكوّن.
  الاستدعاء `const t = getMessages()` ثم `t("key")` أو `t("key", { n: 5 })`.
  المفاتيح مُنمَّطة، فالمفتاح الناقص خطأ ترجمة لا خطأ وقت تشغيل.
- **الألوان كلها توكنز.** `bg-canvas` `bg-surface` `text-ink` `text-ink-muted`
  `border-line` `text-accent` `text-protein/carbs/fat`. **لا لون صريح (hex) في أي مكوّن.**
- **الاستيرادات:** ثلاث مجموعات مفصولة بسطر فارغ ومرتّبة أبجدياً داخل كل مجموعة:
  حزم خارجية ← `@/*` ← `./relative`. تُحذف المجموعة الفارغة.
- **التعليقات تشرح *لماذا* لا *ماذا*:** مبرر قرار، مصيدة، مقايضة غير بديهية.
  هذه الكثافة مقصودة وحمّالة معنى في هذا المشروع.
- **التنسيق:** فواصل منقوطة، علامات تنصيص مزدوجة، عرض سطر 100.
  لا Prettier مثبَّت — طابق الملفات المجاورة.
- **النماذج:** `useActionState` في مكوّن عميل، وserver action ترجع
  `{ errorKey?, noticeKey? }`. **تعبر الحدودَ مفاتيحُ رسائل فقط، لا نصوص.**
  حالة الانتظار من العنصر الثالث الذي يرجّعه `useActionState`، لا من `useFormStatus`.
- **الأخطاء:** كل خطأ من Supabase يمر بـ`authErrorKey` أو `databaseErrorKey` في
  `lib/errors.ts`، وهما يُفهرسان على **رمز** الخطأ لا على نصه، ويسجّلان الأصل في
  الخادم. لا يصل نص خطأ خام إلى المستخدم أبداً.
- **التحقق:** سكيما Zod على حدود الخادم داخل الـaction، ورسائلها **رموز قصيرة**
  (`password_too_short`) يترجمها `issueKey` إلى مفتاح رسالة. التحقق في المتصفح
  مجاملة للمستخدم لا ضابط أمني.
- **كل صفحة محمية تفحص `getUser()` بنفسها** ثم `redirect("/login")`، رغم أن
  `proxy.ts` يحرس المسار أصلاً. حزام إضافي مقصود — أبقِه في كل صفحة جديدة.
- **التفويض في القاعدة:** استعلامات `src/server/*` لا تحوي فلتر ملكية للتفويض؛
  RLS تقصرها على صف المتصل. لا تُضف `where user_id = …` كأنه هو الحماية.
- **أنواع الجداول من `database.types.ts` لا مكتوبة يدوياً.** عملاء Supabase الثلاثة
  يأخذون `Database` كوسيط نوعي، فعمود غير موجود = خطأ ترجمة. **بعد كل migration:
  `npm run db:types`** — بدونها تبقى الأنواع متأخرة عن الـschema بصمت.

## Don't

- **لا ترفع ESLint إلى 10.** `eslint-config-next@16.3.4` يعتمد على `eslint-plugin-react`
  الذي يستدعي `context.getFilename()` المحذوف في ESLint 10، فيسقط اللينت كلياً بـ
  `TypeError: contextOrFilename.getFilename is not a function`. **جُرِّب فعلاً وفشل.**
  الترقية ممكنة فقط حين يدعم `eslint-config-next` الإصدار 10. تحذير npm بأن 9.39.5
  "no longer supported" معروف ومقبول.
- **لا ترفع TypeScript إلى 7.** الإصدار 7.0.2 صادر (النقل إلى Go) وغير مُتحقَّق منه مع
  Next 16 هنا. الترقية مهمة مستقلة بتحقق خاص بها، لا أثر جانبي لتحديث تبعيات.
- **لا تعدّل schema القاعدة إلا بملف migration.** `npx supabase migration new <اسم>` ثم
  `npm run db:push` ثم `npm run db:types`. الوصول المباشر للقاعدة الحية (لوحة التحكم أو
  أدوات MCP) هو بالضبط الدَّين الذي وقع فيه `graduationproj-web` وجعل إعادة إنتاج الـschema
  مستحيلة.
- **لا تفترض أن `db push` مربوط.** يحتاج `npx supabase link --project-ref <ref>` مرة لكل
  مجلد عمل، ويُتحقَّق من نجاحه بوجود `supabase/.temp/project-ref`. بدونه يفشل بـ
  `Cannot find project ref`. **لا يحتاج كلمة مرور القاعدة** — الـCLI يهيّئ دور دخول عبر
  واجهة الإدارة.
- **لا تضف وضعاً فاتحاً.** المشروع ثيم داكن واحد عن قصد (المواصفات dark-first). في
  `graduationproj-web` بقيت متغيرات وضع داكن لا يستهلكها شيء حتى حُذفت. إضافة ثيم ثانٍ
  هنا = إعادة تعريف كتلة `@theme` وحدها، لأن كل لون توكن أصلاً — لكنها قرار منتج لا تحسين.
- **لا تنسخ نمط تنسيق من `graduationproj-web`.** ذاك المشروع فاتح-فقط بلوحة slate/sky
  وأصناف Tailwind مباشرة. هنا داكن-فقط بتوكنز مسمّاة. المشروعان لا يتشاركان نظام تصميم.
- **لا تكتب `dir="rtl"` أو `lang="ar"` في أي مكان غير `layout.tsx`،** وهو يقرؤهما من
  `DIRECTION` و`DEFAULT_LOCALE` في `src/i18n`. تثبيتهما يدوياً يكسر السبب الوحيد لوجود
  تلك البنية.
- **لا تستخدم `.nums` على نص عادي.** هي للأرقام المصطفّة في أعمدة فقط.
- **لا تُنشئ بديل واجهة (primitive) قبل أن ترندره شاشة فعلية.** `ui.tsx` فيه أربعة
  مكوّنات لأن الشاشات القائمة تستخدم أربعة، لا أكثر.
- **لا تحرّر `src/lib/database.types.ts` يدوياً** ولا تكتب شكل جدول بيدك في أي مكان.
  الملف مولَّد، وأي تعديل يدوي يضيع عند أول `npm run db:types`.
- **لا تجعل أنواع الدومين تُستورَد من `database.types.ts`.** الاستقلال مقصود، ويحرسه
  `database-contract.test.ts` بدل الاستيراد: إضافة قيمة إلى enum في القاعدة بلا مقابل في
  المحرك تكسر البناء بدل أن تُنتج `NaN` سعرة بصمت.
- **لا توسّع `PUBLIC_ROUTES` في `lib/supabase/session.ts` بمطابقة بادئة.** المطابقة
  تامّة عمداً: البادئة تجعل كل مسار فرعي يُضاف مستقبلاً عاماً بلا أن ينتبه أحد.
- **لا تستورد مفتاح `service_role` في أي ملف تحت `src/`.** موضعه الوحيد
  `tests/integration/env.ts`، ولإنشاء حسابات الاختبار لا لاختبار السلوك.
  حذف الحساب يمر بدالة `delete_own_account()` في القاعدة تحديداً لهذا السبب.
- **لا تبنِ رابط بريد من ترويسة `Host`.** استخدم `SITE_URL` من `lib/env.ts`.
  ترويسة `Host` يتحكم بها المهاجم، وتسميمها يحوّل بريد إعادة التعيين إلى رمز
  يُسلَّم لغيره.
- **لا تضع بريداً إلكترونياً في أي مسار URL.** المسارات تُخزَّن في تاريخ المتصفح
  وسجلات الخادم وترويسة `Referer`.
- **لا تجعل استعادة كلمة المرور تفرّق بين بريد له حساب وبريد بلا حساب** — لا في
  الرسالة ولا في المسار. الفرق يكشف من هو مستخدم للتطبيق.
- **لا تستعمل `signOut` عبر رابط `<a>`.** هو تغيير حالة، ويمر بنموذج POST.
- **لا تُطبّق قواعد كلمة مرور التسجيل على تسجيل الدخول.** حساب أُنشئ قبل تشديد
  القواعد يجب أن يبقى قادراً على الدخول.
- **لا تكتب معادلة تغذية خارج `features/nutrition/domain`.** ولا تستورد داخله React
  أو Next أو Supabase أو أي طبقة تطبيق. `architecture.test.ts` يفرض هذا آلياً —
  إن كسرته فالإصلاح نقل الكود لا تعديل الاختبار.
- **لا تقرأ `new Date()` داخل الدومين إلا كقيمة افتراضية لوسيط.** خلاف ذلك يجعل النتيجة
  تعتمد على يوم حسابها، فلا تُختبر ولا تُعاد. مفروض بالاختبار نفسه.
- **لا تُعِد رقماً مُعدَّلاً بلا سببه.** كل قصّ يُضيف رمزاً إلى `adjustments`.
  رقم قُصَّ بصمت أسوأ من لا رقم — المستخدم يتبعه شهوراً ولا يعرف أنه ليس ما طلبه.
- **لا تُعِد قاعدة «لا تنزل السعرات تحت الـBMR».** نُقضت عمداً وباختبار يحرس حذفها:
  كانت ستُفعَّل لكل مستخدم خامل يريد خسارة الدهون وتعرض تنبيه سلامة مقابل تغيير ٤٪.
