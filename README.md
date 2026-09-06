# kcal

تطبيق ويب عربي، جوال-أولاً، لتتبع السعرات الحرارية والعناصر الغذائية الكبرى.

> **الحالة: المرحلة ٠١ من ١٢ (الأساس).**
> ما يعمل الآن هو السقالة فقط: صفحة واحدة، نظام توكنز، بنية i18n وRTL، سير عمل
> migrations، وCI. **لا توجد مصادقة ولا قاعدة بيانات ولا تسجيل طعام بعد.**
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
npm run dev      # http://localhost:3000
```

## الأوامر

```bash
npm run dev        # خادم التطوير (Turbopack — الافتراضي في Next 16)
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

**لا يقرأ التطبيق أياً منها بعد** — تُستخدم اعتباراً من المرحلة ٠٢.

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

**الملف المطبَّق حتى الآن:** واحد (`enable_search_extensions`) — و**لم يُطبَّق بعد**،
لأن مشروع Supabase لم يُنشأ.

## الاختبارات

Vitest للمنطق النقي. الاختبارات تجاور الكود الذي تغطّيه (`src/**/*.test.ts`).

Playwright لاختبارات طرف-لطرف واختبارات RLS يُضافان في مرحلتيهما (٠٦ و١٠) — غير مثبَّتَين بعد.

## البنية

```
src/app/         مسارات Next (App Router)
src/components/  بدائل الواجهة
src/i18n/        قاموس الرسائل العربي + دالة الترجمة
supabase/        config.toml + migrations/
docs/            PLAN.md · DECISIONS.md
```

البنية الكاملة المستهدفة — بما فيها `src/features` و`src/server` — في
[docs/PLAN.md](./docs/PLAN.md#8-بنية-المجلدات). المجلدات تُنشأ حين تُملأ، لا قبل ذلك.

## النشر

لم يُنشر بعد. المستضيف المستهدف Vercel.
