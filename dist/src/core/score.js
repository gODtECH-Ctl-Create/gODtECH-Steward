const DEDUCTIONS = { critical: 25, high: 12, medium: 6, low: 2, info: 0 };
export function scoreFindings(findings) { const totals = new Map(); for (const f of findings)
    totals.set(f.rule, (totals.get(f.rule) ?? 0) + DEDUCTIONS[f.severity]); const deduction = [...totals.values()].reduce((s, v) => s + Math.min(v, 25), 0); return Math.max(0, Math.round(100 - Math.min(100, deduction))); }
