import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("trusted external rule-pack manifest is valid JSON and remains design-only", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const schemaPath = resolve(here, "../../schemas/steward-rule-pack-manifest.schema.json");
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as Record<string, unknown>;

  assert.equal(
    schema.schemaVersion,
    undefined,
    "JSON Schema metadata must remain distinct from manifest instances",
  );
  assert.equal(schema.title, "gODtECH Steward Rule Pack Manifest");
  const properties = schema.properties as Record<string, unknown>;
  assert.equal((properties.schemaVersion as Record<string, unknown>).const, 1);
  assert.equal((properties.kind as Record<string, unknown>).const, "steward-rule-pack");
  assert.equal(
    ((properties.artifact as Record<string, unknown>).properties as Record<string, unknown>).format !==
      undefined,
    true,
  );

  const documentation = await readFile(resolve(here, "../../docs/trusted-rule-packs.md"), "utf8");
  assert.match(documentation, /External packs are \*\*analysis-only\*\*/);
  assert.match(documentation, /arbitrary JavaScript or Node\.js/);
});
