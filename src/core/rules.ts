import type { StewardRule } from "./types.js";
import { enabledRulePacks, RULE_PACKS, rulePackSummaries, rulesForPacks } from "./rule-packs.js";

export { RULE_PACKS };

export function enabledRules(
  disabledRules: readonly string[],
  disabledPacks: readonly string[] = [],
): readonly StewardRule[] {
  return rulesForPacks(enabledRulePacks(disabledPacks), disabledRules);
}

export function enabledPackSummaries(disabledPacks: readonly string[] = []) {
  return rulePackSummaries(enabledRulePacks(disabledPacks));
}
