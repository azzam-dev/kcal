import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authErrorKey, databaseErrorKey } from "./errors";

// Every path here logs the original error on purpose; silence it so a passing
// run stays readable, and assert on it where the logging is the point.
let logged: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  logged.mockRestore();
});

describe("authErrorKey", () => {
  it("maps a known auth code", () => {
    expect(authErrorKey({ code: "invalid_credentials" }, "sign-in")).toBe(
      "error.invalidCredentials",
    );
  });

  it("maps both codes Supabase uses for an existing address to one message", () => {
    expect(authErrorKey({ code: "email_exists" }, "sign-up")).toBe("error.emailExists");
    expect(authErrorKey({ code: "user_already_exists" }, "sign-up")).toBe("error.emailExists");
  });

  it("falls back to the generic message for an unknown code", () => {
    expect(authErrorKey({ code: "something_new_in_a_future_release" }, "sign-in")).toBe(
      "error.generic",
    );
  });

  it("falls back when there is no code at all", () => {
    expect(authErrorKey({ message: "Network request failed" }, "sign-in")).toBe("error.generic");
  });

  it("ignores the message text entirely", () => {
    // Guards the rule that mapping keys on CODE, not prose. If someone
    // reintroduces message matching, this starts returning a specific key.
    expect(authErrorKey({ message: "Invalid login credentials" }, "sign-in")).toBe(
      "error.generic",
    );
  });

  it("logs the original error with its context, and never returns it", () => {
    const original = { code: "invalid_credentials", message: "Invalid login credentials" };
    const key = authErrorKey(original, "sign-in");

    expect(logged).toHaveBeenCalledWith("[sign-in]", original);
    expect(key).not.toContain(original.message);
  });
});

describe("databaseErrorKey", () => {
  it("maps an RLS denial to a permission message, not a generic one", () => {
    expect(databaseErrorKey({ code: "42501" }, "profile-update")).toBe("error.notAllowed");
  });

  it("maps a unique violation", () => {
    expect(databaseErrorKey({ code: "23505" }, "profile-update")).toBe("error.duplicate");
  });

  it("maps a check violation to invalid input", () => {
    expect(databaseErrorKey({ code: "23514" }, "profile-update")).toBe("error.invalidInput");
  });

  it("does not borrow the auth table", () => {
    // The two tables are separate on purpose: `invalid_credentials` means
    // nothing coming from Postgres, and a shared table would let one domain's
    // codes shadow the other's.
    expect(databaseErrorKey({ code: "invalid_credentials" }, "profile-update")).toBe(
      "error.generic",
    );
  });
});
