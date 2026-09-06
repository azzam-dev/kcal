# kcal

تطبيق ويب عربي، جوال-أولاً، لتتبع السعرات الحرارية والعناصر الغذائية الكبرى.

> **الحالة: المرحلة ٠٢ من ١٢ (المصادقة والملف الشخصي).**
> تدفقات المصادقة والملف الشخصي مكتوبة كاملة، لكن **لم تُطبَّق أي migration على القاعدة**
> بعد، فلم يُجرَّب أي تدفق يلمسها. **لا يوجد تسجيل طعام ولا حساب سعرات بعد.**
> التفصيل في [PROGRESS.md](./PROGRESS.md).

## الوثائق

| الملف | المحتوى |
|---|---|
| [PROGRESS.md](./PROGRESS.md) | حالة العمل الحيّة: ما تم، ما هو التالي، المشاكل المعروفة |
| [docs/PLAN.md](./docs/PLAN.md) | الخطة الهندسية: النطاق، المعمارية، نموذج البيانات، المراحل |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | سجل القرارات: القرار ← السبب ← البديل المرفوض |
| [CLAUDE.md](./CLAUDE.md) | الأعراف المتّبعة فعلاً في الكود |

## المتطلبات

- **Node 24** (مثبَّت في CI؛ التطوير المحلي جرى على 24.19.0)
- npm 11

## التشغيل

```bash
npm install
npm run dev      # http://localhost:3001
```

المنفذ 3001 مثبَّت في سكربت `dev` عمداً: يجب أن يطابق `NEXT_PUBLIC_SITE_URL` وإلا أشارت
روابط البريد إلى منفذ لا يعمل، و3000 مشغول بمشروع آخر في هذا الجهاز.

## الأوامر

```bash
npm run dev        # خادم التطوير على 3001 (Turbopack — الافتراضي في Next 16)
npm run build      # بناء الإنتاج، ويفشل على أخطاء الأنواع
npm run start      # تشغيل حزمة الإنتاج
npm run typecheck  # tsc --noEmit
npm run lint       # eslint — لا يعمل ضمن next build في Next 16، فشغّله بنفسك
npm test           # vitest run
npm run test:watch # vitest في وضع المراقبة
```

**`npm run build` لا يشغّل ESLint.** أسقطت Next 16 تشغيل اللينتر ضمن البناء،
فالبناء الناجح **لا** يعني أن اللينت نظيف. الأربعة معاً هي بوابة CI.

## متغيرات البيئة

انسخ [.env.example](./.env.example) إلى `.env.local` واملأه من لوحة Supabase.
المتغيرات كلها `NEXT_PUBLIC_`، أي أنها **تُحقن في الحزمة وقت البناء لا وقت التشغيل** —
تغييرها على المستضيف يوجب إعادة بناء، وإعادة نشر تستخدم الكاش تُعيد الحزمة القديمة.

`NEXT_PUBLIC_SITE_URL` يبني روابط التأكيد وإعادة تعيين كلمة المرور. **لا يُشتق من ترويسة
`Host`** — تلك يتحكم بها المهاجم، وتسميمها يحوّل بريد إعادة التعيين إلى رمز يُسلَّم لغيره.
يجب أيضاً إدراج نفس العنوان في لوحة Supabase ← Authentication ← URL Configuration.

## قاعدة البيانات

**مصدر الحقيقة للـschema هو `supabase/migrations/`، لا المشروع الحي.**

```bash
npx supabase link --project-ref <ref>   # مرة واحدة لكل جهاز
npm run db:push                          # يطبّق الـmigrations غير المطبَّقة
npm run db:diff                          # يقارن المشروع الحي بالملفات
npm run db:types                         # يولّد src/lib/database.types.ts
```

**لا تعدّل القاعدة الحية يدوياً ولا عبر أدوات MCP.** أي تغيير schema يبدأ بملف:

```bash
npx supabase migration new <اسم_وصفي>
```

هذا ليس تفضيلاً أسلوبياً — المشروع الشقيق `graduationproj-web` طبّق ثمانية migrations
مباشرة على مشروعه الحي، فصار من غير الممكن إعادة إنتاج الـschema في بيئة جديدة.

**الملفات المكتوبة:** اثنان (`enable_search_extensions` و`create_profiles`).
**المطبَّق على القاعدة: صفر** — انظر PROGRESS.md.

## الاختبارات

**اختبارات الوحدة** بـVitest، تجاور الكود الذي تغطّيه (`src/**/*.test.ts`).
تعمل بلا أي إعداد: `npm test`.

**اختبارات RLS** في `tests/integration/rls/`. تتحدث إلى مشروع Supabase حقيقي —
وهذا هو المقصود: التفويض يفرضه Postgres، فمحاكاته لا تثبت عنه شيئاً.
تحتاج ملف `.env.test.local` (مستثنى من git):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**مفتاح `service_role` للاختبارات وحدها**، ولإنشاء الحسابات المؤقتة وحذفها فقط —
أما السلوك المُختبَر فيمر بجلسة حقيقية عبر المفتاح المنشور، تماماً كما يفعل المتصفح.
**لا ملف تحت `src/` يستورده.** بدون الملف تتخطّى هذه الاختبارات نفسها بصمت.

Playwright لاختبارات طرف-لطرف يُضاف في المرحلة ٠٦ — غير مثبَّت بعد.

## البنية

```
src/app/         مسارات Next (App Router) — (auth) و(app) وauth/confirm
src/components/  بدائل الواجهة
src/i18n/        قاموس الرسائل العربي + دالة الترجمة
src/lib/         env · errors · redirect · supabase/ · validation/
src/server/      استعلامات قاعدة البيانات، بلا قواعد عمل
src/proxy.ts     بوابة الجلسة (اصطلاح Next 16)
tests/           اختبارات التكامل
supabase/        config.toml + migrations/
docs/            PLAN.md · DECISIONS.md
```

البنية الكاملة المستهدفة — بما فيها `src/features` — في
[docs/PLAN.md](./docs/PLAN.md#8-بنية-المجلدات). المجلدات تُنشأ حين تُملأ، لا قبل ذلك.

## النشر

لم يُنشر بعد. المستضيف المستهدف Vercel.
