const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

function parseArgs(value) {
  try {
    const parsed = JSON.parse(value || '["scan","--ci"]');
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("Action args must be a JSON array of strings.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid Steward action args: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const actionPath = join(__dirname, "dist", "src", "cli.js");
const repositoryPath = process.env.INPUT_PATH || ".";
const args = parseArgs(process.env.INPUT_ARGS);
const result = spawnSync(process.execPath, [actionPath, ...args, repositoryPath], {
  stdio: "inherit",
  windowsHide: true
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
