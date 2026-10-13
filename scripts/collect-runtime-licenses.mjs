import { copyFile, lstat, mkdir, readFile, readdir, readlink, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Run after `pnpm build`. An optional project root supports isolated verification.
const projectRoot = path.resolve(process.argv[2] ?? process.cwd());
const runtimeRoot = path.join(projectRoot, ".next", "standalone", "node_modules");
const installedRoot = path.join(projectRoot, "node_modules");
const outputRoot = path.join(projectRoot, "third-party-licenses");
const noticeName = /(?:^|[._ -])(?:licen[sc]es?|notices?|copying|copyrights?|legal|third[._ -]?party)(?:$|[._ -])/i;
const summary = {
  runtimePackages: 0,
  standalonePackages: 0,
  skippedManifestsWithoutNameOrVersion: 0,
  missingLicenseMetadata: 0,
  missingNoticeFiles: 0,
  missingInstalledPackages: 0,
  ignoredExternalRuntimeLinks: 0,
  declaredDependenciesIncluded: 0,
  supplementalPackages: 0,
  provenanceExceptions: 0,
};

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function resolveWithin(boundary, candidate) {
  let current = path.resolve(candidate);
  const links = new Set();
  for (let depth = 0; depth < 64; depth += 1) {
    if (!within(boundary, current)) return null;
    if (links.has(current)) throw new Error(`Cyclic license traversal link: ${candidate}`);
    links.add(current);
    if (!(await lstat(current)).isSymbolicLink()) {
      const resolved = await realpath(current);
      return within(boundary, resolved) ? resolved : null;
    }
    // Next can copy a directory as a file-type symlink on Windows. Stat its
    // explicit target instead of the link, without ignoring missing packages.
    current = path.resolve(path.dirname(current), await readlink(current));
  }
  throw new Error(`License traversal link exceeds 64 targets: ${candidate}`);
}

async function manifest(directory) {
  try {
    return JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function packageKey(metadata) {
  return typeof metadata?.name === "string" && typeof metadata?.version === "string"
    ? `${metadata.name}@${metadata.version}`
    : null;
}

async function entries(directory) {
  return (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

async function indexInstalledPackages() {
  const packages = new Map();
  const visited = new Set();
  async function add(directory) {
    const resolved = await realpath(directory);
    if (visited.has(resolved)) return;
    visited.add(resolved);
    const metadata = await manifest(resolved);
    const key = packageKey(metadata);
    if (key) packages.set(key, { directory: resolved, metadata });
  }
  async function scanModules(directory) {
    for (const entry of await entries(directory)) {
      if (entry.name.startsWith(".")) continue;
      const child = path.join(directory, entry.name);
      if (entry.name.startsWith("@")) {
        for (const scoped of await entries(child)) await add(path.join(child, scoped.name));
      } else if (entry.isDirectory() || entry.isSymbolicLink()) {
        await add(child);
      }
    }
  }
  await scanModules(installedRoot);
  const store = path.join(installedRoot, ".pnpm");
  let storeEntries = [];
  try {
    storeEntries = await entries(store);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const entry of storeEntries) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const modules = path.join(store, entry.name, "node_modules");
    try {
      await stat(modules);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    await scanModules(modules);
  }
  // Next includes versioned dependency manifests and notices in dist/compiled,
  // even when standalone tracing omits those dependencies' license files.
  for (const [nextKey, original] of [...packages]) {
    if (original.metadata.name !== "next") continue;
    const boundary = original.directory;
    const compiled = path.join(boundary, "dist", "compiled");
    const visited = new Set();
    async function scanVendor(directory) {
      const resolved = await resolveWithin(boundary, directory);
      if (resolved === null || visited.has(resolved)) return;
      visited.add(resolved);
      const metadata = await manifest(resolved);
      const key = packageKey(metadata);
      if (key && !packages.has(key)) {
        packages.set(key, {
          directory: resolved,
          metadata,
          bundledIn: nextKey,
          bundledDirectory: path.relative(boundary, resolved).split(path.sep).join("/"),
        });
      }
      for (const entry of await entries(resolved)) {
        if (entry.name === "node_modules") continue;
        const child = path.join(resolved, entry.name);
        if (entry.isDirectory()) await scanVendor(child);
        else if (entry.isSymbolicLink()) {
          const target = await resolveWithin(boundary, child);
          if (target !== null && (await stat(target)).isDirectory()) await scanVendor(target);
        }
      }
    }
    let hasCompiledDirectory = true;
    try {
      await stat(compiled);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hasCompiledDirectory = false;
    }
    if (hasCompiledDirectory) await scanVendor(compiled);
  }
  return packages;
}

async function discoverRuntimePackages() {
  const boundary = await realpath(runtimeRoot);
  const visited = new Set();
  const packages = new Map();
  async function walk(directory) {
    const resolved = await resolveWithin(boundary, directory);
    if (resolved === null) {
      summary.ignoredExternalRuntimeLinks += 1;
      return;
    }
    if (visited.has(resolved)) return;
    visited.add(resolved);
    const metadata = await manifest(resolved);
    if (metadata) {
      const key = packageKey(metadata);
      if (key) packages.set(key, { directory: resolved, metadata, inclusion: ["standalone"] });
      else summary.skippedManifestsWithoutNameOrVersion += 1;
    }
    for (const entry of await entries(resolved)) {
      const child = path.join(resolved, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (entry.isSymbolicLink()) {
        const target = await resolveWithin(boundary, child);
        if (target === null) summary.ignoredExternalRuntimeLinks += 1;
        else if ((await stat(target)).isDirectory()) await walk(target);
      }
    }
  }
  await walk(boundary);
  return packages;
}

async function copyNotices(packageDirectory, destination) {
  const boundary = await realpath(packageDirectory);
  const visited = new Set();
  const notices = [];
  async function walk(directory, relative = "", noticeDirectory = false) {
    const resolved = await resolveWithin(boundary, directory);
    if (resolved === null || visited.has(resolved)) return;
    visited.add(resolved);
    for (const entry of await entries(resolved)) {
      if (entry.name === "node_modules") continue;
      const child = path.join(resolved, entry.name);
      const childRelative = path.join(relative, entry.name);
      const matched = noticeDirectory || noticeName.test(entry.name);
      const source = entry.isSymbolicLink() ? await resolveWithin(boundary, child) : child;
      if (source === null) continue;
      const childStat = entry.isSymbolicLink() ? await stat(source) : entry;
      if (childStat.isDirectory()) {
        await walk(source, childRelative, matched);
      } else if (childStat.isFile() && matched) {
        const target = path.join(destination, childRelative);
        await mkdir(path.dirname(target), { recursive: true });
        await copyFile(source, target);
        notices.push(childRelative.split(path.sep).join("/"));
      }
    }
  }
  // Includes notices for partially bundled dependencies in Next's dist/compiled.
  await walk(boundary);
  return notices.sort();
}

async function includeDeclaredDependencies(runtime) {
  const project = await manifest(projectRoot);
  for (const name of Object.keys(project?.dependencies ?? {}).sort()) {
    const directory = await realpath(path.join(installedRoot, name));
    const metadata = await manifest(directory);
    const key = packageKey(metadata);
    if (!key) throw new Error(`Declared runtime dependency lacks package metadata: ${name}`);
    if (runtime.has(key)) runtime.get(key).inclusion.push("declared dependency");
    else runtime.set(key, { directory, metadata, inclusion: ["declared dependency (may be bundled)"] });
    summary.declaredDependenciesIncluded += 1;
  }
}

async function fallbackManifest() {
  try {
    return JSON.parse(await readFile(path.join(projectRoot, "docs", "licenses", "runtime-notice-fallbacks.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function copySupplementalNotices(fallback, destination) {
  const boundary = await realpath(projectRoot);
  const notices = [];
  for (const file of fallback.files) {
    if (typeof file !== "string" || path.isAbsolute(file)) throw new Error("Supplemental notices require project-relative file paths.");
    const source = await resolveWithin(boundary, path.resolve(boundary, file));
    if (source === null || !(await stat(source)).isFile()) throw new Error(`Unsafe supplemental notice file: ${file}`);
    const relative = path.relative(boundary, path.resolve(boundary, file));
    const target = path.join(destination, "supplemental", relative);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    notices.push(path.join("supplemental", relative).split(path.sep).join("/"));
  }
  return notices;
}

async function copyNextEnvNotice(metadata, installed, destination) {
  if (metadata.name !== "@next/env") return null;
  const nextKey = `next@${metadata.version}`;
  const next = installed.get(nextKey);
  if (!next || metadata.license !== "MIT" || next.metadata.license !== "MIT") return null;
  const repository = metadata.repository?.url ?? metadata.repository ?? "";
  if (!repository.includes("github.com/vercel/next.js")) return null;
  const files = (await entries(next.directory)).filter((entry) => entry.isFile() && noticeName.test(entry.name));
  const notices = [];
  for (const entry of files) {
    const relative = path.join("shared-repository", encodeURIComponent(nextKey), entry.name);
    const target = path.join(destination, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(next.directory, entry.name), target);
    notices.push(relative.split(path.sep).join("/"));
  }
  return { package: nextKey, note: "@next/env is MIT-licensed in the same vercel/next.js repository; retain that release's repository license notice.", notices };
}

async function prepareOutput() {
  let existing;
  try {
    existing = await entries(outputRoot);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing) {
    const resolved = await realpath(outputRoot);
    const projectBoundary = await realpath(projectRoot);
    if (!within(projectBoundary, resolved) || resolved === projectBoundary) {
      throw new Error("License output must remain inside the project root.");
    }
    if (existing.length) {
      const inventory = JSON.parse(await readFile(path.join(outputRoot, "inventory.json"), "utf8"));
      if (inventory.generatedBy !== "scripts/collect-runtime-licenses.mjs") {
        throw new Error("Refusing to replace license output that was not generated by this script.");
      }
      // Regeneration removes only the verified, previously generated output directory.
      await rm(outputRoot, { recursive: true, force: true });
    }
  }
  await mkdir(outputRoot, { recursive: true });
}

const [installed, runtime] = await Promise.all([indexInstalledPackages(), discoverRuntimePackages()]);
if (runtime.size === 0) throw new Error("No runtime packages found; build Next.js with output: 'standalone' first.");
summary.standalonePackages = runtime.size;
await includeDeclaredDependencies(runtime);
const fallbacks = await fallbackManifest();
await prepareOutput();
const packages = [];
for (const [key, runtimePackage] of [...runtime].sort(([a], [b]) => a.localeCompare(b, "en"))) {
  const original = installed.get(key);
  if (!original) summary.missingInstalledPackages += 1;
  const source = original ?? runtimePackage;
  const metadata = source.metadata;
  const license = metadata.license ?? metadata.licenses ?? null;
  const repository = metadata.repository;
  const sourceRepository = typeof repository === "string" ? repository : repository?.url ?? null;
  const directory = encodeURIComponent(key);
  const destination = path.join(outputRoot, directory);
  const notices = await copyNotices(source.directory, destination);
  const sharedRepositoryNotice = await copyNextEnvNotice(metadata, installed, destination);
  if (sharedRepositoryNotice) notices.push(...sharedRepositoryNotice.notices);
  const supplementalNotice = fallbacks[key] ?? null;
  if (supplementalNotice) {
    notices.push(...await copySupplementalNotices(supplementalNotice, destination));
    summary.supplementalPackages += 1;
  }
  const provenanceException = supplementalNotice?.provenanceException === true;
  if (provenanceException) summary.provenanceExceptions += 1;
  if (!license) summary.missingLicenseMetadata += 1;
  if (notices.length === 0 || provenanceException) summary.missingNoticeFiles += 1;
  packages.push({
    name: metadata.name, version: metadata.version, license, sourceRepository, directory,
    inclusion: runtimePackage.inclusion,
    noticeStatus: provenanceException ? "upstream notice unavailable; provenance exception" : notices.length ? "preserved" : "missing",
    notices: [...new Set(notices)].sort(),
    ...(original?.bundledIn ? { bundledIn: original.bundledIn, bundledDirectory: original.bundledDirectory } : {}),
    ...(sharedRepositoryNotice ? { sharedRepositoryNotice } : {}),
    ...(supplementalNotice ? { supplementalNotice } : {}),
  });
}
summary.runtimePackages = packages.length;
await writeFile(path.join(outputRoot, "inventory.json"), `${JSON.stringify({
  generatedBy: "scripts/collect-runtime-licenses.mjs",
  scope: "Standalone runtime packages plus declared production dependencies, including dependencies bundled into server/client chunks. Vendored and pinned supplemental notices are preserved with provenance.",
  limitation: "Notice preservation is not a complete source, binary, or license-compliance audit. Re-run on the target build platform.",
  summary,
  packages,
}, null, 2)}\n`);
console.log(`Runtime notices: ${packages.length} packages; ${summary.missingLicenseMetadata} missing license metadata; ${summary.missingNoticeFiles} missing notices (${summary.provenanceExceptions} provenance exceptions); ${summary.missingInstalledPackages} missing installed originals.`);
if (packages.some((entry) => entry.name === "client-only" && entry.version === "0.0.1")) {
  throw new Error("Original client-only artifact remains; the independently authored marker replacement is required. See third-party-licenses/inventory.json.");
}
const unresolved = [
  "missingLicenseMetadata", "missingNoticeFiles", "missingInstalledPackages",
  "ignoredExternalRuntimeLinks", "provenanceExceptions",
].filter((key) => summary[key] !== 0);
if (unresolved.length) {
  throw new Error(`Runtime license inventory has unresolved gaps: ${unresolved.map((key) => `${key}=${summary[key]}`).join(", ")}. See third-party-licenses/inventory.json.`);
}
