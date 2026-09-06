import type { MessageKey } from "@/i18n";

import type { AdjustmentReason, InputIssue } from "./domain";

/**
 * Maps what the calculation engine reports to what the user reads.
 *
 * The engine returns codes, never sentences: it has no business knowing what
 * language anyone reads, and `architecture.test.ts` keeps it that way. This
 * file is the one place that closes that gap, and it lives outside `domain/`
 * for the same reason — the mapping needs `MessageKey`, and the engine must
 * not.
 *
 * Both maps are total `Record`s rather than the `Partial<Record<string, …>>`
 * that `lib/validation/messages.ts` uses. That file keys on Zod's open-ended
 * issue codes and has to fall back; these key on closed unions, so a value
 * added to `AdjustmentReason` with no message here is a compile error rather
 * than a reason that reaches the screen as a bare code.
 */

const ADJUSTMENT_KEYS: Record<AdjustmentReason, MessageKey> = {
  deficit_capped: "adjustment.deficitCapped",
  surplus_capped: "adjustment.surplusCapped",
  calorie_floor_applied: "adjustment.calorieFloorApplied",
  macros_rebalanced: "adjustment.macrosRebalanced",
  macros_below_floor: "adjustment.macrosBelowFloor",
  target_weight_underweight: "adjustment.targetWeightUnderweight",
};

const INPUT_ISSUE_KEYS: Record<InputIssue, MessageKey> = {
  age_below_minimum: "field.ageBelowMinimum",
  age_implausible: "field.ageImplausible",
  height_out_of_range: "field.heightOutOfRange",
  weight_out_of_range: "field.weightOutOfRange",
  target_weight_required: "field.targetWeightRequired",
  target_weight_out_of_range: "field.targetWeightOutOfRange",
  custom_rate_required: "field.customRateRequired",
  custom_rate_out_of_range: "field.customRateOutOfRange",
};

/**
 * All of them, in the order the engine produced them.
 *
 * Every adjustment is shown, not just the first: each one names a different
 * number that is not what the arithmetic asked for, and hiding the rest puts
 * the app back in the business of changing figures silently.
 */
export function adjustmentKeys(reasons: readonly AdjustmentReason[]): MessageKey[] {
  return reasons.map((reason) => ADJUSTMENT_KEYS[reason]);
}

/** First issue only: one clear thing to fix beats a list of five. */
export function inputIssueKey(issues: readonly InputIssue[]): MessageKey {
  const first = issues[0];
  return first ? INPUT_ISSUE_KEYS[first] : "error.invalidInput";
}
