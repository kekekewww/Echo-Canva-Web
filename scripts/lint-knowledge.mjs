import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const index = "knowledge/wiki/index.md";
const entryPoints = ["AGENTS.md", "CLAUDE.md", "docs/README.md", "docs/adr/README.md"];
const fields = [
  "Goal", "Scope", "Owner", "Branch / Worktree", "Status", "Dependencies",
  "Related Files", "Acceptance Criteria", "Verification Evidence", "Next Action",
];
const statuses = new Set(["Proposed", "Ready", "In Progress", "Blocked", "Implemented", "Verified"]);
const errors = [];

function markdownFiles(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = directory + "/" + entry.name;
    if (entry.isDirectory()) return markdownFiles(file);
    return entry.isFile() && file.endsWith(".md") ? [file] : [];
  });
}

function visibleMarkdown(file) {
  return readFileSync(resolve(root, file), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^ {0,3}(\x60{3,}|~{3,})[^\r\n]*\r?\n[\s\S]*?^ {0,3}\1[ \t]*\r?$/gm, "");
}

function inlineLinks(markdown) {
  return Array.from(markdown.matchAll(/(?<!!)\[[^\]\r\n]+\]\((?:<([^>\r\n]+)>|([^\s()]+))\)/g),
    (match) => match[1] ?? match[2]);
}

function headingIds(markdown) {
  const ids = new Set();
  for (const [, title] of markdown.matchAll(/^#{1,6}[ \t]+(.+)$/gm)) {
    const slug = title.trim().toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    let id = slug;
    for (let suffix = 1; ids.has(id); suffix++) id = slug + "-" + suffix;
    ids.add(id);
  }
  return ids;
}

function localTarget(file, href) {
  if (/^https?:\/\//i.test(href)) return null;
  const [path, anchor] = href.split("#", 2).map(decodeURIComponent);
  const absolute = path ? resolve(root, dirname(file), path) : resolve(root, file);
  const target = relative(root, absolute);
  if (isAbsolute(path) || isAbsolute(target) || path.includes("\\") ||
      target === ".." || target.startsWith(".." + sep) || /^[a-z]+:/i.test(path)) {
    throw new Error("use a repository-relative path");
  }
  if (!statSync(absolute, { throwIfNoEntry: false })) throw new Error("target is missing");
  return { target: target.split(sep).join("/"), anchor };
}

function checkTask(file, markdown) {
  const id = file.split("/").at(-1).slice(0, -3);
  if (!/^EC-\d{3,}$/.test(id) || !markdown.startsWith("# " + id + " — ")) {
    errors.push(file + " — task ID must match its filename");
  }
  const entries = Array.from(markdown.matchAll(/^- ([^:\r\n]+):[ \t]+([^\r\n]+)$/gm));
  const values = new Map();
  for (const field of fields) {
    const matches = entries.filter((entry) => entry[1] === field);
    if (matches.length !== 1 || !matches[0][2].trim()) {
      errors.push(file + " — expected one nonempty " + field);
    } else {
      values.set(field, matches[0][2].trim());
    }
  }
  const status = values.get("Status");
  if (!statuses.has(status)) errors.push(file + " — unknown task status");
  if (["In Progress", "Implemented", "Verified"].includes(status) &&
      ["Owner", "Branch / Worktree"].some((field) => values.get(field) === "Unassigned")) {
    errors.push(file + " — active or delivered task has no claim");
  }
  if (status === "Verified" && !inlineLinks(values.get("Verification Evidence") ?? "").length) {
    errors.push(file + " — Verified requires linked evidence");
  }
  const dependencies = values.get("Dependencies") ?? "";
  const taskLinks = inlineLinks(dependencies);
  if (dependencies !== "None" && (!taskLinks.length || taskLinks.some((href) =>
    !/^EC-\d{3,}\.md$/.test(href) || href === id + ".md"))) {
    errors.push(file + " — Dependencies must link to other task files in this directory or be None");
  }
}

const knowledge = markdownFiles("knowledge");
const files = new Map([...knowledge, ...entryPoints].map((file) => [file, visibleMarkdown(file)]));
const graph = new Map();

for (const [file, markdown] of files) {
  const targets = new Set();
  const links = inlineLinks(markdown);
  for (const href of links) {
    try {
      const local = localTarget(file, href);
      if (!local) continue;
      const { target, anchor } = local;
      if (anchor && target.startsWith("knowledge/") && files.has(target) &&
          !headingIds(files.get(target)).has(anchor)) {
        throw new Error("knowledge heading is missing");
      }
      targets.add(target);
    } catch (error) {
      errors.push(file + " — " + href + " — " + error.message);
    }
  }
  graph.set(file, targets);
  if (file.startsWith("knowledge/tasks/")) checkTask(file, markdown);
  if (file.startsWith("knowledge/raw/") && links.length === 0) {
    errors.push(file + " — evidence record must link to its source or reproducible input");
  }
}

for (const file of ["AGENTS.md", "CLAUDE.md"]) {
  for (const target of [index, "knowledge/schema.md"]) {
    if (!graph.get(file).has(target)) errors.push(file + " — missing entry link to " + target);
  }
}
if (!/^@AGENTS\.md\r?$/m.test(files.get("CLAUDE.md"))) {
  errors.push("CLAUDE.md — missing @AGENTS.md import");
}

const reachable = new Set([index]);
const queue = [index];
for (const page of queue) {
  for (const target of graph.get(page) ?? []) {
    if (target.startsWith("knowledge/") && !reachable.has(target)) {
      reachable.add(target);
      queue.push(target);
    }
  }
}
for (const file of knowledge) {
  if (!reachable.has(file)) errors.push(file + " — unreachable from " + index);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Knowledge lint passed (" + knowledge.length + " pages, " + entryPoints.length + " entry points).");
}
