import { describe, expect, it, vi } from "vitest";

import { ar } from "./ar";
import { DIRECTION, getMessages, translate, type MessageKey } from "./index";

describe("translate", () => {
  it("returns the message for a known key", () => {
    expect(translate("home.cta")).toBe("ابدأ");
  });

  it("substitutes placeholders", () => {
    expect(translate("home.buildStatus", { phase: 1, total: 12 })).toBe(
      "قيد التطوير — المرحلة 1 من 12",
    );
  });

  it("leaves a placeholder intact when no variable is supplied", () => {
    // Visible `{total}` on screen names the missing variable. Silently emitting
    // an empty string would hide the bug from whoever is looking at the page.
    expect(translate("home.buildStatus", { phase: 1 })).toBe(
      "قيد التطوير — المرحلة 1 من {total}",
    );
  });

  it("ignores variables the message does not use", () => {
    expect(translate("home.cta", { unused: "x" })).toBe("ابدأ");
  });

  it("falls back to the key and logs when the key is unknown at runtime", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Typed call sites cannot reach this branch; a key built from data can.
    expect(translate("does.not.exist" as MessageKey)).toBe("does.not.exist");
    expect(spy).toHaveBeenCalledOnce();

    spy.mockRestore();
  });
});

describe("getMessages", () => {
  it("binds a locale so call sites never pass one", () => {
    const t = getMessages("ar");
    expect(t("app.name")).toBe("kcal");
  });
});

describe("catalogue", () => {
  it("has a direction for every locale it ships", () => {
    expect(DIRECTION.ar).toBe("rtl");
  });

  it("has no empty messages", () => {
    const empty = Object.entries(ar).filter(([, value]) => value.trim() === "");
    expect(empty).toEqual([]);
  });
});
