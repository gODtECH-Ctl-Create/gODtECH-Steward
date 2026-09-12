import { documentationRule } from "../rules/documentation.js";
import { dependenciesRule } from "../rules/dependencies.js";
import { hygieneRule } from "../rules/hygiene.js";
import { repositoryRule } from "../rules/repository.js";
import { securityRule } from "../rules/security.js";
export const RULES = [repositoryRule, securityRule, documentationRule, dependenciesRule, hygieneRule];
export function enabledRules(disabled) { const excluded = new Set(disabled); return RULES.filter((rule) => !excluded.has(rule.id)); }
