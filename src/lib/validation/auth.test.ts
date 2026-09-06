import { describe, expect, it } from "vitest";

import {
  displayNameSchema,
  loginSchema,
  PASSWORD_MAX_BYTES,
  registerSchema,
} from "./auth";

function firstIssue(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("registerSchema", () => {
  it("accepts a valid pair", () => {
    const result = registerSchema.safeParse({ email: "a@b.test", password: "correct-horse" });
    expect(result.success).toBe(true);
  });

  it("normalises the email so the same address cannot register twice in two cases", () => {
    const result = registerSchema.safeParse({
      email: "  Azzam@Example.TEST ",
      password: "correct-horse",
    });
    expect(result.success && result.data.email).toBe("azzam@example.test");
  });

  it("rejects a password under the minimum", () => {
    const result = registerSchema.safeParse({ email: "a@b.test", password: "short12" });
    expect(firstIssue(result)).toBe("password_too_short");
  });

  it("rejects a password over bcrypt's 72-byte limit", () => {
    // Past 72 bytes bcrypt ignores the rest, so two different passwords would
    // open the same account and nobody would be told.
    const result = registerSchema.safeParse({
      email: "a@b.test",
      password: "a".repeat(PASSWORD_MAX_BYTES + 1),
    });
    expect(firstIssue(result)).toBe("password_too_long");
  });

  it("counts BYTES, not characters", () => {
    // Arabic is two bytes per character in UTF-8, so 40 characters is 80 bytes
    // — already over the limit while looking well short of it.
    const arabic = "ك".repeat(40);
    expect(arabic.length).toBeLessThan(PASSWORD_MAX_BYTES);
    expect(firstIssue(registerSchema.safeParse({ email: "a@b.test", password: arabic }))).toBe(
      "password_too_long",
    );
  });

  it("rejects a malformed email", () => {
    expect(firstIssue(registerSchema.safeParse({ email: "not-an-email", password: "correct-horse" }))).toBe(
      "email_invalid",
    );
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password", () => {
    // Sign-in must not apply the sign-up rules: an account created before those
    // rules existed still has to be able to get in.
    const result = loginSchema.safeParse({ email: "a@b.test", password: "old" });
    expect(result.success).toBe(true);
  });

  it("still requires a password", () => {
    expect(firstIssue(loginSchema.safeParse({ email: "a@b.test", password: "" }))).toBe(
      "password_required",
    );
  });
});

describe("displayNameSchema", () => {
  it("accepts an empty name, which means clear it", () => {
    const result = displayNameSchema.safeParse({ displayName: "  " });
    expect(result.success && result.data.displayName).toBe("");
  });

  it("accepts Arabic with spaces", () => {
    const result = displayNameSchema.safeParse({ displayName: "عزام الفهد" });
    expect(result.success && result.data.displayName).toBe("عزام الفهد");
  });

  it("rejects a name over 60 characters", () => {
    expect(firstIssue(displayNameSchema.safeParse({ displayName: "ع".repeat(61) }))).toBe(
      "display_name_too_long",
    );
  });
});
