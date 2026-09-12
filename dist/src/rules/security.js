const SECRET_PATTERNS = [{ name: "private key", regex: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ }, { name: "GitHub token", regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/ }, { name: "GitHub fine-grained token", regex: /github_pat_[A-Za-z0-9_]{20,}/ }, { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ }, { name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{20,}/ }, { name: "Stripe secret key", regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ }];
function isEnvFile(path) { const name = path.split("/").pop()?.toLowerCase() ?? ""; return name === ".env" || (name.startsWith(".env.") && !name.endsWith(".example") && !name.endsWith(".template")); }
export function securityFindings(files, tracked) { const out = []; for (const f of files) {
    if (isEnvFile(f.relPath) && tracked.has(f.relPath))
        out.push({ id: "security.tracked-env-file", rule: "tracked-env-file", category: "security", severity: "critical", message: "An environment file appears to be tracked by Git.", path: f.relPath, fixable: false });
    if (!f.isText || f.content === undefined)
        continue;
    for (const p of SECRET_PATTERNS) {
        const m = p.regex.exec(f.content);
        if (m === null)
            continue;
        const line = f.content.slice(0, m.index).split(/\r?\n/).length;
        out.push({ id: `security.possible-secret.${p.name.replaceAll(" ", "-")}`, rule: "possible-secret", category: "security", severity: "critical", message: `Possible ${p.name} detected.`, path: f.relPath, line, fixable: false });
    }
} return out; }
