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
  details?: string;
}

export interface FileEntry {
  absPath: string;
  relPath: string;
  size: number;
  isText: boolean;
  content?: string;
}

export interface ScanConfig {
  version: number;
  exclude: string[];
  maxFileSizeBytes: number;
  largeFileThresholdBytes: number;
  ci: {
    failOn: Severity;
  };
}

export interface ScanResult {
  version: 1;
  root: string;
  scannedFiles: number;
  textFiles: number;
  findings: Finding[];
  healthScore: number;
  durationMs: number;
}
