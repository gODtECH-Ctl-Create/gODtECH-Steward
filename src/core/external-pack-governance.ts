import { readFile } from "node:fs/promises";
import type { ExternalPackPolicy } from "./types.js";
import { verifyRulePack, type RulePackManifest, type VerifiedRulePack } from "./trust.js";

export type ExternalPackVerificationReason =
  | "verified"
  | "invalid_manifest"
  | "pack_not_allowed"
  | "publisher_untrusted"
  | "publisher_revoked"
  | "key_revoked"
  | "trusted_key_missing"
  | "signature_invalid"
  | "artifact_mismatch"
  | "artifact_invalid"
  | "incompatible"
  | "verification_failed";

export type ExternalPackAdmissionReason =
  | "admitted"
  | "verification_rejected"
  | "execution_disabled"
  | "provenance_missing"
  | "provenance_source_untrusted"
  | "pin_missing"
  | "pin_version_mismatch"
  | "pin_digest_mismatch";

export interface ExternalPackAuditRecord {
  schemaVersion: 1;
  kind: "steward-external-pack-audit";
  observedAt: string;
  pack: { id: string | null; version: string | null };
  publisher: { id: string | null; keyId: string | null };
  artifact: { format: string | null; sha256: string | null };
  compatibility: { ruleApi: number | null; resultSchema: number | null };
  provenance: {
    present: boolean;
    sourceRepository: string | null;
    sourceCommit: string | null;
    builder: string | null;
  };
  verification: {
    accepted: boolean;
    signatureVerified: boolean;
    reasonCode: ExternalPackVerificationReason;
  };
  admission: {
    requested: boolean;
    allowed: boolean;
    reasonCode: ExternalPackAdmissionReason;
  };
}

export interface ExternalPackEvaluation {
  verified?: VerifiedRulePack;
  failure?: Error;
  audit: ExternalPackAuditRecord;
}

interface PartialManifestIdentity {
  id: string | null;
  version: string | null;
  publisherId: string | null;
  keyId: string | null;
  artifactFormat: string | null;
  artifactSha256: string | null;
  ruleApi: number | null;
  resultSchema: number | null;
  provenance?: RulePackManifest["provenance"];
}

type AdmissionDecision = Pick<ExternalPackAuditRecord["admission"], "allowed" | "reasonCode">;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function partialIdentity(raw: unknown): PartialManifestIdentity {
  const manifest = asRecord(raw) ?? {};
  const publisher = asRecord(manifest.publisher) ?? {};
  const artifact = asRecord(manifest.artifact) ?? {};
  const compatibility = asRecord(manifest.compatibility) ?? {};
  const provenance = asRecord(manifest.provenance);
  return {
    id: stringValue(manifest.id),
    version: stringValue(manifest.version),
    publisherId: stringValue(publisher.id),
    keyId: stringValue(publisher.keyId),
    artifactFormat: stringValue(artifact.format),
    artifactSha256: stringValue(artifact.sha256),
    ruleApi: numberValue(compatibility.ruleApi),
    resultSchema: numberValue(compatibility.resultSchema),
    provenance: provenance && typeof provenance.sourceRepository === "string" && typeof provenance.sourceCommit === "string" && typeof provenance.builder === "string"
      ? {
          sourceRepository: provenance.sourceRepository,
          sourceCommit: provenance.sourceCommit,
          builder: provenance.builder
        }
      : undefined
  };
}

function verificationReason(error: Error): ExternalPackVerificationReason {
  const message = error.message;
  if (/unsupported compatibility\.(ruleApi|resultSchema)/.test(message)) return "incompatible";
  if (/not allowed by policy/.test(message)) return "pack_not_allowed";
  if (/publisher is not trusted/.test(message)) return "publisher_untrusted";
  if (/publisher is revoked/.test(message)) return "publisher_revoked";
  if (/signing key is revoked/.test(message)) return "key_revoked";
  if (/No trusted Ed25519 key configured/.test(message)) return "trusted_key_missing";
  if (/signature verification failed/.test(message)) return "signature_invalid";
  if (/Artifact (size|SHA-256) mismatch/.test(message)) return "artifact_mismatch";
  if (/not a valid WebAssembly/.test(message)) return "artifact_invalid";
  if (/Invalid rule-pack manifest/.test(message)) return "invalid_manifest";
  return "verification_failed";
}

export function assessExternalPackAdmission(
  verified: VerifiedRulePack,
  policy: ExternalPackPolicy
): AdmissionDecision {
  if (!policy.execution.enabled) return { allowed: false, reasonCode: "execution_disabled" };

  const provenance = verified.manifest.provenance;
  if (!provenance) return { allowed: false, reasonCode: "provenance_missing" };
  if (!policy.execution.trustedSourceRepositories.includes(provenance.sourceRepository)) {
    return { allowed: false, reasonCode: "provenance_source_untrusted" };
  }

  const pin = policy.execution.pins[verified.manifest.id];
  if (!pin) return { allowed: false, reasonCode: "pin_missing" };
  if (pin.version !== verified.manifest.version) return { allowed: false, reasonCode: "pin_version_mismatch" };
  if (pin.sha256.toLowerCase() !== verified.artifactSha256.toLowerCase()) return { allowed: false, reasonCode: "pin_digest_mismatch" };

  return { allowed: true, reasonCode: "admitted" };
}

function auditFrom(
  identity: PartialManifestIdentity,
  policy: ExternalPackPolicy,
  verification: ExternalPackAuditRecord["verification"],
  admission: AdmissionDecision
): ExternalPackAuditRecord {
  return {
    schemaVersion: 1,
    kind: "steward-external-pack-audit",
    observedAt: new Date().toISOString(),
    pack: { id: identity.id, version: identity.version },
    publisher: { id: identity.publisherId, keyId: identity.keyId },
    artifact: { format: identity.artifactFormat, sha256: identity.artifactSha256?.toLowerCase() ?? null },
    compatibility: { ruleApi: identity.ruleApi, resultSchema: identity.resultSchema },
    provenance: {
      present: Boolean(identity.provenance),
      sourceRepository: identity.provenance?.sourceRepository ?? null,
      sourceCommit: identity.provenance?.sourceCommit ?? null,
      builder: identity.provenance?.builder ?? null
    },
    verification,
    admission: {
      requested: policy.execution.enabled,
      allowed: admission.allowed,
      reasonCode: admission.reasonCode
    }
  };
}

export async function evaluateExternalPack(
  manifestPath: string,
  artifactPath: string,
  policy: ExternalPackPolicy
): Promise<ExternalPackEvaluation> {
  let identity: PartialManifestIdentity = {
    id: null,
    version: null,
    publisherId: null,
    keyId: null,
    artifactFormat: null,
    artifactSha256: null,
    ruleApi: null,
    resultSchema: null
  };

  try {
    identity = partialIdentity(JSON.parse(await readFile(manifestPath, "utf8")) as unknown);
  } catch {
    // Verification below produces the authoritative failure; audit identity remains intentionally partial.
  }

  try {
    const verified = await verifyRulePack(manifestPath, artifactPath, policy);
    identity = partialIdentity(verified.manifest);
    const admission = assessExternalPackAdmission(verified, policy);
    return {
      verified,
      audit: auditFrom(
        identity,
        policy,
        { accepted: true, signatureVerified: verified.signatureVerified, reasonCode: "verified" },
        admission
      )
    };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    return {
      failure,
      audit: auditFrom(
        identity,
        policy,
        { accepted: false, signatureVerified: false, reasonCode: verificationReason(failure) },
        { allowed: false, reasonCode: "verification_rejected" }
      )
    };
  }
}
