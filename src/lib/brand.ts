/**
 * The two brand colours that have to exist as JavaScript values.
 *
 * Every colour in the app is a token in `globals.css` and every component
 * reads it through Tailwind — these are the exception, not a second palette:
 * the browser theme colour, the web app manifest and the generated app icon
 * are consumed outside CSS, by the browser and the operating system, and none
 * of them can read a custom property.
 *
 * **They mirror `--color-canvas` and `--color-accent` in `src/app/globals.css`
 * and must be changed together with them.** `src/app/icon.svg` carries the same
 * two values a third time, because a static SVG cannot import anything.
 */

/** `--color-canvas`. The app's background, and the OS-level window colour. */
export const CANVAS_COLOR = "#0d1110";

/** `--color-accent`. The mark itself. */
export const ACCENT_COLOR = "#45c7a8";
