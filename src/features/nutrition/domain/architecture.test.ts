import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The one architectural rule this project has, enforced rather than described.
 *
 * The calculation engine is pure TypeScript: no React, no Supabase, no fetch,
 * no clock it did not receive. That is what lets it be tested exhaustively
 * without a database or a browser, and swapped without touching the app. A
 * comment saying so survives exactly until someone is in a hurry; this does not.
 */

const DOMAIN_DIR = __dirname;

const FORBIDDEN = [
  { pattern: /from\s+["']react/, why: "React" },
  { pattern: /from\s+["']next[/"']/, why: "Next.js" },
  { pattern: /from\s+["']@supabase\//, why: "Supabase" },
  { pattern: /from\s+["']@\/(lib|server|app|components)\//, why: "an application layer" },
  { pattern: /\bfetch\s*\(/, why: "a network call" },
];

function sourceFiles(): string[] {
  return readdirSync(DOMAIN_DIR).filter(
    (name) => name.endsWith(".ts") && !name.endsWith(".test.ts"),
  );
}

describe("the nutrition domain stays pure", () => {
  it("has source files to check", () => {
    // Without this, a rename that empties the folder would turn every rule
    // below into a test that passes because it examined nothing.
    expect(sourceFiles().length).toBeGreaterThan(4);
  });

  it.each(sourceFiles())("%s imports nothing from outside the domain", (file) => {
    const source = readFileSync(join(DOMAIN_DIR, file), "utf8");

    for (const { pattern, why } of FORBIDDEN) {
      expect(pattern.test(source), `${file} must not reach for ${why}`).toBe(false);
    }
  });

  it.each(sourceFiles())("%s does not read the clock for itself", (file) => {
    const source = readFileSync(join(DOMAIN_DIR, file), "utf8");

    // `new Date()` is allowed only as a default parameter, where the caller can
    // still override it. Anywhere else it makes a result depend on the day it
    // was computed, which cannot be tested and cannot be reproduced.
    const bareClock = source.match(/new Date\(\)/g) ?? [];
    const asDefault = source.match(/=\s*new Date\(\)/g) ?? [];

    expect(bareClock.length).toBe(asDefault.length);
  });
});
