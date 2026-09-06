import type { MetadataRoute } from "next";

import { DEFAULT_LOCALE, DIRECTION, getMessages } from "@/i18n";
import { CANVAS_COLOR } from "@/lib/brand";

/**
 * The web app manifest — what the phone reads when someone keeps the app on
 * their home screen.
 *
 * Generated rather than a static file in `public/` so the name, the language
 * and the direction come from the same catalogue every screen uses; a hand-kept
 * JSON copy is a copy that keeps the old product name after a rename.
 *
 * This makes the app installable and gives it a standalone window and an icon.
 * It does NOT make it work offline, and Chrome's install prompt on Android
 * additionally wants a service worker. Offline is explicitly out of the MVP
 * (docs/DECISIONS.md), so that arrives with the PWA work rather than here.
 */
export default function manifest(): MetadataRoute.Manifest {
  const t = getMessages();

  return {
    name: t("app.name"),
    short_name: t("app.name"),
    // The Arabic sentence, not the English tagline: this is the description the
    // OS shows, and it is read by the same person who reads the app.
    description: t("home.body"),
    lang: DEFAULT_LOCALE,
    dir: DIRECTION[DEFAULT_LOCALE],
    start_url: "/",
    display: "standalone",
    background_color: CANVAS_COLOR,
    theme_color: CANVAS_COLOR,
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  };
}
