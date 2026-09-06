import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./redirect";

const FALLBACK = "/profile";

describe("safeRedirectPath", () => {
  it("allows a same-site absolute path", () => {
    expect(safeRedirectPath("/dashboard", FALLBACK)).toBe("/dashboard");
  });

  it("keeps a query string and hash on an allowed path", () => {
    expect(safeRedirectPath("/food?q=rice#top", FALLBACK)).toBe("/food?q=rice#top");
  });

  it.each([
    ["nothing", null],
    ["empty string", ""],
    ["an absolute http URL", "http://evil.test/steal"],
    ["an absolute https URL", "https://evil.test/steal"],
    ["a protocol-relative URL", "//evil.test/steal"],
    ["a backslash-escaped host", "/\\evil.test"],
    ["a backslash anywhere", "/food\\..\\evil"],
    ["a bare relative path", "dashboard"],
    ["a scheme other than http", "javascript:alert(1)"],
    ["a leading tab that some parsers strip", "/\thttps://evil.test"],
    ["a leading newline that some parsers strip", "/\nhttps://evil.test"],
  ])("falls back for %s", (_label, value) => {
    expect(safeRedirectPath(value, FALLBACK)).toBe(FALLBACK);
  });
});
