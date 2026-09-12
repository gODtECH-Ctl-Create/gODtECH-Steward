import { dependenciesRule } from "../rules/dependencies.js";
import { documentationRule } from "../rules/documentation.js";
import { hygieneRule } from "../rules/hygiene.js";
import { maintenanceRule } from "../rules/maintenance.js";
import { metadataRule } from "../rules/metadata.js";
import { repositoryRule } from "../rules/repository.js";
import { securityRule } from "../rules/security.js";
const CORE_RULES = [repositoryRule, documentationRule, dependenciesRule, maintenanceRule, metadataRule, hygieneRule];
export const RULE_PACKS = [
  { id: "core", version: 2, description: "Generic repository, documentation, dependency, maintenance, metadata, and hygiene checks.", rules: CORE_RULES },
  { id: "security", version: 1, description: "High-confidence repository security and credential-pattern checks.", rules: [securityRule] }
];
export function enabledRulePacks(disabled) { const excluded = new Set(disabled); return RULE_PACKS.filter((pack) => !excluded.has(pack.id)); }
export function rulePackSummaries(packs) { return packs.map(({ id, version }) => ({ id, version })); }
export function rulesForPacks(packs, disabledRules) { const excluded = new Set(disabledRules); const seen = new Set(); const rules = []; for (const pack of packs) { for (const rule of pack.rules) { if (excluded.has(rule.id) || seen.has(rule.id)) continue; seen.add(rule.id); rules.push(rule); } } return rules; }
