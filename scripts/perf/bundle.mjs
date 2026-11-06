import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { sha256Text, tempEnvironment } from "./lib.mjs";

export const BUNDLE_ROOT = ".perf-runs/bundle";
const HARNESS = "benchmarks/perf/harness";

/**
 * Vite is not a direct dependency. It is present because vitest depends on it, so it is resolved
 * through vitest's own package, which is the copy the unit tests build with.
 */
export function resolveVite(repoRoot) {
  const fromRoot = createRequire(join(repoRoot, "package.json"));
  const fromVitest = createRequire(fromRoot.resolve("vitest/package.json"));
  return {
    entry: fromVitest.resolve("vite"),
    version: JSON.parse(readFileSync(fromVitest.resolve("vite/package.json"), "utf8")).version,
  };
}

/** Node kinds build with `build.ssr` and inline every dependency; page kinds build an HTML entry. */
const KINDS = {
  node: { entry: `${HARNESS}/node-entry.ts`, ssr: true },
  "generate-workloads": { entry: `${HARNESS}/generate-workloads.ts`, ssr: true },
  pool: { html: "pool-page.html", preamble: true },
  "pool-bare": { html: "pool-page-bare.html", preamble: false },
};

function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...listFiles(join(dir, entry.name)));
    else files.push(join(dir, entry.name));
  }
  return files.sort();
}

/** SHA-256 over the sorted relative paths and contents of every file in the bundle. */
export function hashBundle(dir) {
  const parts = listFiles(dir).map((file) => `${relative(dir, file).replaceAll("\\", "/")}\u0000${sha256Text(readFileSync(file))}`);
  return sha256Text(parts.join("\n"));
}

const PREAMBLE = "__EC102_PREAMBLE__";
const PRODUCTION_LISTENERS = ["controller.handle(event.data)"];

/**
 * Checks the built worker scripts. With a preamble, every production worker script must contain
 * the preamble's marker before the production listener registration. Without one (`bare`), no
 * worker script may mention the preamble at all.
 */
export function checkWorkerBundles(dir, expectPreamble) {
  const checks = [];
  // The probe bundle also carries the production worker scripts that the pools would load by
  // default; the harness never starts them, so only the entry scripts are checked there.
  const scriptPattern = expectPreamble ? /worker-entry-[^/\\]*\.js$/ : /\.worker-[^/\\]*\.js$/;
  const scripts = listFiles(dir).filter((name) => scriptPattern.test(name));
  for (const file of scripts) {
    const text = readFileSync(file, "utf8");
    const production = PRODUCTION_LISTENERS.map((needle) => text.indexOf(needle)).filter((index) => index >= 0);
    if (production.length === 0) continue;
    const marker = text.indexOf(PREAMBLE);
    const name = relative(dir, file).replaceAll("\\", "/");
    const ok = expectPreamble ? marker >= 0 && marker < Math.min(...production) : marker < 0;
    checks.push({ file: name, preamblePresent: marker >= 0, preambleIndex: marker, productionListenerIndex: Math.min(...production), ok });
  }
  if (checks.length === 0) throw new Error("no production worker script found in the bundle");
  const failed = checks.filter(({ ok }) => !ok);
  if (failed.length > 0) {
    throw new Error(`worker bundle check failed: ${failed.map(({ file }) => file).join(", ")} (preamble expected: ${expectPreamble})`);
  }
  return checks;
}

export async function buildBundle(repoRoot, kind) {
  // The bundler writes through os.tmpdir(); refuse to run with it pointing outside the worktree on Windows.
  tempEnvironment(repoRoot);
  const spec = KINDS[kind];
  if (!spec) throw new Error(`Unknown bundle kind ${kind}`);
  const vite = resolveVite(repoRoot);
  const { build } = await import(pathToFileURL(vite.entry).href);
  const outDir = resolve(repoRoot, BUNDLE_ROOT, kind);
  mkdirSync(outDir, { recursive: true });
  const common = {
    configFile: false,
    publicDir: false,
    logLevel: "warn",
    cacheDir: resolve(repoRoot, ".perf-runs/vite-cache"),
    resolve: { alias: { "@": resolve(repoRoot, "src") } },
    define: { "process.env.NODE_ENV": '"production"' },
    worker: { format: "iife", rollupOptions: { output: { entryFileNames: "assets/[name]-[hash].js" } } },
  };
  if (spec.ssr) {
    await build({
      ...common,
      root: repoRoot,
      ssr: { noExternal: true },
      build: {
        ssr: resolve(repoRoot, spec.entry),
        outDir,
        emptyOutDir: true,
        minify: false,
        target: "esnext",
        sourcemap: false,
        rollupOptions: { output: { entryFileNames: "[name].mjs", format: "es" } },
      },
    });
    return { kind, dir: outDir, sha256: hashBundle(outDir), viteVersion: vite.version, workerChecks: [] };
  }
  await build({
    ...common,
    root: resolve(repoRoot, HARNESS),
    base: "./",
    build: {
      outDir,
      emptyOutDir: true,
      minify: false,
      target: "esnext",
      sourcemap: false,
      rollupOptions: { input: resolve(repoRoot, HARNESS, spec.html) },
    },
  });
  const workerChecks = checkWorkerBundles(outDir, spec.preamble);
  return { kind, dir: outDir, sha256: hashBundle(outDir), viteVersion: vite.version, workerChecks, page: spec.html };
}
