import type { StewardRule } from "./types.js";
import { dependenciesRule } from "../rules/dependencies.js";
import { documentationRule } from "../rules/documentation.js";
import { hygieneRule } from "../rules/hygiene.js";
import { maintenanceRule } from "../rules/maintenance.js";
import { repositoryRule } from "../rules/repository.js";
import { securityRule } from "../rules/security.js";

export const RULES: readonly StewardRule[] = [
  repositoryRule,
  securityRule,
  documentationRule,
  dependenciesRule,
  maintenanceRule,
  hygieneRule
];

export function enabledRules(disabled: readonly string[]): readonly StewardRule[] {
  const excluded = new Set(disabled);
  return RULES.filter((rule) => !excluded.has(rule.id));
}
