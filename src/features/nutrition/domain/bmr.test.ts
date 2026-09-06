import { describe, expect, it } from "vitest";

import { ageFromBirthYear, mifflinStJeor } from "./bmr";

describe("mifflinStJeor", () => {
  it("computes the documented male equation", () => {
    // 10·80 + 6.25·180 − 5·30 + 5 = 800 + 1125 − 150 + 5
    expect(
      mifflinStJeor.calculate({ gender: "male", weightKg: 80, heightCm: 180, ageYears: 30 }),
    ).toBe(1780);
  });

  it("computes the documented female equation", () => {
    // 10·60 + 6.25·165 − 5·30 − 161 = 600 + 1031.25 − 150 − 161
    expect(
      mifflinStJeor.calculate({ gender: "female", weightKg: 60, heightCm: 165, ageYears: 30 }),
    ).toBe(1320.25);
  });

  it("separates the two constants by exactly 166", () => {
    // The only difference between the two forms is +5 versus −161. Asserting
    // the gap catches a transposed constant, which no single-value test would.
    const shared = { weightKg: 70, heightCm: 170, ageYears: 25 } as const;
    const male = mifflinStJeor.calculate({ ...shared, gender: "male" });
    const female = mifflinStJeor.calculate({ ...shared, gender: "female" });

    expect(male - female).toBe(166);
  });

  it("loses 5 kcal per year of age", () => {
    const shared = { gender: "male", weightKg: 80, heightCm: 180 } as const;

    expect(
      mifflinStJeor.calculate({ ...shared, ageYears: 30 }) -
        mifflinStJeor.calculate({ ...shared, ageYears: 31 }),
    ).toBe(5);
  });

  it("gains 10 kcal per kilogram and 6.25 per centimetre", () => {
    const shared = { gender: "female", ageYears: 40 } as const;

    expect(
      mifflinStJeor.calculate({ ...shared, weightKg: 61, heightCm: 160 }) -
        mifflinStJeor.calculate({ ...shared, weightKg: 60, heightCm: 160 }),
    ).toBe(10);

    expect(
      mifflinStJeor.calculate({ ...shared, weightKg: 60, heightCm: 161 }) -
        mifflinStJeor.calculate({ ...shared, weightKg: 60, heightCm: 160 }),
    ).toBe(6.25);
  });

  it("is identified, so a stored target can say which formula produced it", () => {
    expect(mifflinStJeor.id).toBe("mifflin-st-jeor");
  });
});

describe("ageFromBirthYear", () => {
  it("subtracts the birth year from the current year", () => {
    expect(ageFromBirthYear(1996, new Date("2026-09-06T00:00:00Z"))).toBe(30);
  });

  it("does not wait for the birthday, because only the year is stored", () => {
    // Someone born in December 1996 reads as 30 from 1 January 2026. The
    // documented cost of storing a year: at most one year out, which is 5 kcal
    // of BMR — smaller than the error in the equation itself.
    expect(ageFromBirthYear(1996, new Date("2026-01-01T00:00:00Z"))).toBe(30);
    expect(ageFromBirthYear(1996, new Date("2026-12-31T00:00:00Z"))).toBe(30);
  });

  it("rolls over at the turn of the year, not at any other moment", () => {
    expect(ageFromBirthYear(1996, new Date("2027-01-01T00:00:00Z"))).toBe(31);
  });
});
