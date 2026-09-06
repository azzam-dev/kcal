# kcal

تطبيق ويب عربي، جوال-أولاً، لتتبع السعرات والعناصر الغذائية الكبرى.

**المشروع في المرحلة ٠١ من ١٢.** الموجود سقالة فقط. اقرأ [PROGRESS.md](./PROGRESS.md)
لحالة العمل، و[docs/PLAN.md](./docs/PLAN.md) للخطة، و[docs/DECISIONS.md](./docs/DECISIONS.md)
للقرارات ومبرراتها. هذا الملف يصف **الأعراف المتّبعة فعلاً في الكود القائم** — لا المستهدفة.

## Stack

- Next.js 16.3.4 (App Router، Turbopack افتراضياً)، React 19.2.8، TypeScript 5.9 (`strict`
  + `noUncheckedIndexedAccess`)
- Tailwind CSS v4 — التوكنز في `@theme` داخل `src/app/globals.css`، **لا ملف `tailwind.config.*`**
- Vitest 5 للمنطق النقي
- Supabase CLI كـdevDependency (`npx supabase`) — **لا مشروع Supabase بعد**
- ESLint **9.39.5 مثبَّت عمداً** — انظر "Don't"

## الأوامر

```bash
npm run dev        # Turbopack
npm run build      # لا يشغّل ESLint (Next 16 أسقطت ذلك)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest run
```

الأربعة معاً هي بوابة CI. **البناء الناجح وحده لا يعني أن اللينت نظيف.**

## المجلدات القائمة

```
src/app/globals.css     التوكنز في @theme + قواعد عامة (focus-visible، .nums)
src/app/layout.tsx      <html lang="ar" dir="rtl"> + الخط، كلاهما من src/i18n لا مكتوبان يدوياً
src/app/page.tsx        صفحة انتظار المرحلة ٠١
src/components/ui.tsx   Button و Card — البدائل الوحيدة حتى الآن
src/i18n/ar.ts          قاموس الرسائل العربي — كل نص يراه المستخدم
src/i18n/index.ts       Locale · DIRECTION · translate() · getMessages()
src/i18n/i18n.test.ts   اختبارات الترجمة
supabase/migrations/    مصدر الحقيقة للـschema
```

`src/features` و`src/server` مخطَّطان ولم يُنشآ. **لا تُنشئ مجلداً قبل أن تملأه.**

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

## Don't

- **لا ترفع ESLint إلى 10.** `eslint-config-next@16.3.4` يعتمد على `eslint-plugin-react`
  الذي يستدعي `context.getFilename()` المحذوف في ESLint 10، فيسقط اللينت كلياً بـ
  `TypeError: contextOrFilename.getFilename is not a function`. **جُرِّب فعلاً وفشل.**
  الترقية ممكنة فقط حين يدعم `eslint-config-next` الإصدار 10. تحذير npm بأن 9.39.5
  "no longer supported" معروف ومقبول.
- **لا ترفع TypeScript إلى 7.** الإصدار 7.0.2 صادر (النقل إلى Go) وغير مُتحقَّق منه مع
  Next 16 هنا. الترقية مهمة مستقلة بتحقق خاص بها، لا أثر جانبي لتحديث تبعيات.
- **لا تعدّل قاعدة البيانات إلا بملف migration.** `npx supabase migration new <اسم>`.
  الوصول المباشر للقاعدة الحية (لوحة التحكم أو أدوات MCP) هو بالضبط الدَّين الذي وقع فيه
  `graduationproj-web` وجعل إعادة إنتاج الـschema مستحيلة.
- **لا تضف وضعاً فاتحاً.** المشروع ثيم داكن واحد عن قصد (المواصفات dark-first). في
  `graduationproj-web` بقيت متغيرات وضع داكن لا يستهلكها شيء حتى حُذفت. إضافة ثيم ثانٍ
  هنا = إعادة تعريف كتلة `@theme` وحدها، لأن كل لون توكن أصلاً — لكنها قرار منتج لا تحسين.
- **لا تنسخ نمط تنسيق من `graduationproj-web`.** ذاك المشروع فاتح-فقط بلوحة slate/sky
  وأصناف Tailwind مباشرة. هنا داكن-فقط بتوكنز مسمّاة. المشروعان لا يتشاركان نظام تصميم.
- **لا تكتب `dir="rtl"` أو `lang="ar"` في أي مكان غير `layout.tsx`،** وهو يقرؤهما من
  `DIRECTION` و`DEFAULT_LOCALE` في `src/i18n`. تثبيتهما يدوياً يكسر السبب الوحيد لوجود
  تلك البنية.
- **لا تستخدم `.nums` على نص عادي.** هي للأرقام المصطفّة في أعمدة فقط.
- **لا تُنشئ بديل واجهة (primitive) قبل أن ترندره شاشة فعلية.** `ui.tsx` فيه مكوّنان
  لأن الشاشة الوحيدة تستخدم مكوّنين.
- **لا تربط زر "ابدأ" في `page.tsx` بمسار غير موجود.** هو معطَّل عمداً حتى تُبنى
  `/register` في المرحلة ٠٢.
