import { ImageResponse } from "next/og";

import { ACCENT_COLOR, CANVAS_COLOR } from "@/lib/brand";

/**
 * The home-screen icon on iOS, generated as a PNG at build time.
 *
 * It exists as code rather than as a file because iOS is the one place that
 * will not take the SVG in `icon.svg`, and a checked-in binary would be a
 * second copy of the mark that nobody remembers to redraw. The shape is built
 * from plain boxes — the renderer behind ImageResponse supports a subset of
 * CSS and no font is assumed, so a drawn letter cannot go missing.
 *
 * Replace this with real artwork when there is any; the route name is all iOS
 * cares about.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BAR = {
  position: "absolute" as const,
  top: 0,
  width: 22,
  height: 104,
  borderRadius: 4,
  background: ACCENT_COLOR,
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CANVAS_COLOR,
        }}
      >
        {/* Clipped, so the rotated bar stops at the same top and bottom as the
            uprights instead of poking out past both corners. */}
        <div
          style={{
            position: "relative",
            width: 104,
            height: 104,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div style={{ ...BAR, left: 0 }} />
          <div style={{ ...BAR, right: 0 }} />
          {/* Top-left to bottom-right, so it reads as an N and not as two bars.
              Taller than the uprights because a rotated bar has to cover the
              same vertical span across the diagonal. */}
          <div
            style={{
              ...BAR,
              left: 41,
              height: 118,
              top: -7,
              transform: "rotate(-22deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
