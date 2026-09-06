import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

import { DEFAULT_LOCALE, DIRECTION, getMessages } from "@/i18n";

import "./globals.css";

/**
 * One family for the whole app, on purpose. This product is mostly numbers in
 * aligned columns, and IBM Plex Sans Arabic carries Arabic and Latin with the
 * same metrics and real tabular figures — mixing a second display face would
 * cost another font download to solve a problem the app does not have.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  // Only the weights the app actually renders. Each extra weight is a font file
  // in the critical path; add one when a screen needs it, not in advance.
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const t = getMessages(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: t("app.name"),
  // `home.body`, not `app.tagline`: the tagline is the English half of the
  // wordmark, and this string is what a search result and a shared link show to
  // a reader who came here for an Arabic app.
  description: t("home.body"),
};

export const viewport: Viewport = {
  themeColor: "#0d1110",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The font variable class goes on <html>, not <body>. Tailwind declares
  // `--font-sans: var(--font-plex-arabic), …` on `:root`; if `--font-plex-arabic`
  // is only defined further down the tree, `--font-sans` is invalid at
  // computed-value time on `:root` and resolves to nothing — every element then
  // silently falls back to the browser's default sans. Verified in the browser:
  // with the class on <body>, `getComputedStyle(document.body).fontFamily` came
  // back as the generic system stack instead of IBM Plex Sans Arabic.
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={DIRECTION[DEFAULT_LOCALE]}
      className={plexArabic.variable}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
