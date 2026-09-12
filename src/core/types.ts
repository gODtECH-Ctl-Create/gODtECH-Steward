export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Category =
  | "repository"
  | "security"
  | "documentation"
  | "code"
  | "dependencies"
  | "git"
  | "configuration";

export interface Finding {
  id: string;
  rule: string;
  category: Category;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
  fixable: boolean;
  confidence: "high" | "medium" | "low";
  details?: string;
  remediation?: string;
}

export interface FileEntry {
  absPath: string;
  relPath: string;
  size: number;
  isText: boolean;
  content?: string;
}

export interface ScanConfig {
  version: 1;
  exclude: string[];
  maxFileSizeBytes: number;
  largeFileThresholdBytes: number;
  ci: {
    failOn: Severity;
  };
  rules: {
    disabled: string[];
  };
}

export interface GitFacts {
  isRepository: boolean;
  root?: string;
  branch?: string;
  commit?: string;
  dirty?: boolean;
  trackedFiles: ReadonlySet<string>;
}

export interface ScanContext {
  root: string;
  config: ScanConfig;
  files: readonly FileEntry[];
  trackedFiles: ReadonlySet<string>;
  git: GitFacts;
}

export interface StewardRule {
  id: string;
  category: Category;
  description: string;
  run(context: ScanContext): Finding[];
}

export interface ScanResult {
  version: 1;
  root: string;
  scannedFiles: number;
  textFiles: number;
  findings: Finding[];
  healthScore: number;
  durationMs: number;
  git: GitFacts;
  categoryCounts: Partial<Record<Category, number>>;
  ruleCounts: Record<string, number>;
}

export interface ConfigLoadResult {
  config: ScanConfig;
  warning?: string;
}
