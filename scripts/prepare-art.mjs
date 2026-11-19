// Hydrate the exact reviewed local files before building or starting the development server.
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
const manifest = JSON.parse(
  await readFile(new URL("./art-manifest.json", import.meta.url)),
);
const root = fileURLToPath(new URL("../public/art/", import.meta.url));
const entries = Object.entries(manifest);
const hash = (data) => createHash("sha256").update(data).digest("hex");
async function hydrate([name, entry]) {
  const path = join(root, name);
  try {
    if (hash(await readFile(path)) === entry.sha256) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    const temp = path + "." + randomUUID() + ".part";
    try {
      const res = await fetch(entry.url, {
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw Error("HTTP " + res.status);
      const data = Buffer.from(await res.arrayBuffer());
      if (hash(data) !== entry.sha256) throw Error("SHA-256 mismatch");
      await writeFile(temp, data);
      await rename(temp, path);
      return;
    } catch (error) {
      if (attempt === 3) throw Error(name + ": " + error.message);
    } finally {
      await rm(temp, { force: true });
    }
  }
}
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (entries.length) await hydrate(entries.pop());
  }),
);
console.log(
  "Station art verified · " + Object.keys(manifest).length + " files.",
);
