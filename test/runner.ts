import { readdir } from "node:fs/promises";

const directory = new URL(".", import.meta.url);
const files = await readdir(directory);
for (const file of files.filter((name: string) => name.endsWith(".test.js")).sort()) {
  await import(new URL(file, directory).href);
}
