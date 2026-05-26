import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const targets = process.argv[2] ? [process.argv[2]] : ["chrome", "firefox"];
const copyPaths = ["src/background", "src/newtab", "src/setup", "src/shared", "src/_locales", "src/images"];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function mergeManifest(base, override) {
  return { ...base, ...override };
}

async function buildTarget(target) {
  if (!["chrome", "firefox"].includes(target)) {
    throw new Error(`Unsupported target: ${target}`);
  }

  const outDir = join(root, "dist", target);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relative of copyPaths) {
    if (existsSync(join(root, relative))) {
      await cp(join(root, relative), join(outDir, relative.replace(/^src[\\/]/, "")), {
        recursive: true
      });
    }
  }

  const base = await readJson(join(root, "src", "manifest.base.json"));
  const override = await readJson(join(root, "src", `manifest.${target}.json`));
  const manifest = mergeManifest(base, override);
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

for (const target of targets) {
  await buildTarget(target);
}
