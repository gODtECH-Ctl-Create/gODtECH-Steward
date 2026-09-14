import { getProduct, renderIdentity } from "@godtech/cli-identity";

function requireStewardIdentity() {
  const product = getProduct("steward");
  if (!product) throw new Error("Missing STEWARD identity profile.");
  return product;
}

const stewardIdentity = requireStewardIdentity();

export interface StewardIdentityContext {
  isTTY?: boolean;
  noBanner?: string;
}

export function stewardIdentityBanner(
  targetCols = process.stdout.columns ?? 80,
  unicode = process.env.STEWARD_ASCII !== "1",
): string {
  const width = Math.max(40, Math.min(128, Math.floor(targetCols)));
  return renderIdentity(stewardIdentity, { targetCols: width, unicode });
}

export function shouldShowStewardIdentity(
  argv: string[],
  context: StewardIdentityContext = {},
): boolean {
  const isTTY = context.isTTY ?? Boolean(process.stdout.isTTY);
  const noBanner = context.noBanner ?? process.env.STEWARD_NO_BANNER;

  if (!isTTY || noBanner === "1") return false;
  if (argv.includes("--json") || argv.includes("--ci")) return false;
  if (argv.includes("--version") || argv.includes("-v")) return false;

  const command = argv[0] ?? "help";
  if (command === "forge-evidence") return false;

  return true;
}

export function printStewardIdentity(): void {
  console.log(stewardIdentityBanner());
  console.log("");
}
