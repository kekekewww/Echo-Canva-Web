// Summarize a Grype JSON report as Markdown for the CI job log and step summary.
// Report-only: this script never fails on findings (issue #10). It exits 0 when
// the report is missing or unreadable and says so, so a scanner or database
// outage stays visible without blocking the Docker job.
import { readFile } from "node:fs/promises";

const reportPath = process.argv[2] ?? "grype-results.json";
const detailLimit = 50;
const severityOrder = ["Critical", "High", "Medium", "Low", "Negligible", "Unknown"];

let report;
try {
  report = JSON.parse(await readFile(reportPath, "utf8"));
} catch (error) {
  console.log("## Image vulnerability scan (report-only)\n");
  console.log(`No readable Grype report at \`${reportPath}\` (${error.code ?? error.message}).`);
  console.log("The scan step did not complete; see its log. This does not fail CI.");
  process.exit(0);
}

const matches = Array.isArray(report.matches) ? report.matches : [];
const normalizeSeverity = (value) =>
  severityOrder.find((name) => name.toLowerCase() === String(value ?? "").toLowerCase()) ??
  "Unknown";

const counts = Object.fromEntries(severityOrder.map((name) => [name, { total: 0, fixable: 0 }]));
const rows = [];
for (const match of matches) {
  const vulnerability = match.vulnerability ?? {};
  const artifact = match.artifact ?? {};
  const severity = normalizeSeverity(vulnerability.severity);
  const fixVersions = vulnerability.fix?.versions ?? [];
  const fixable = vulnerability.fix?.state === "fixed" && fixVersions.length > 0;
  counts[severity].total += 1;
  if (fixable) counts[severity].fixable += 1;
  rows.push({
    severity,
    id: vulnerability.id ?? "unknown",
    name: artifact.name ?? "unknown",
    version: artifact.version ?? "",
    type: artifact.type ?? "",
    fix: fixable ? fixVersions.join(", ") : (vulnerability.fix?.state ?? "unknown"),
  });
}

const rank = (severity) => severityOrder.indexOf(severity);
rows.sort(
  (a, b) =>
    rank(a.severity) - rank(b.severity) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id),
);

const cell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const target = report.source?.target;
const imageName =
  (typeof target === "object" ? (target?.userInput ?? target?.tags?.[0]) : target) ?? "unknown";
const dbBuilt = report.descriptor?.db?.status?.built ?? report.descriptor?.db?.built ?? "unknown";

console.log("## Image vulnerability scan (report-only)\n");
console.log(
  `Image: \`${imageName}\` · Grype ${report.descriptor?.version ?? "unknown"} · ` +
    `vulnerability DB built ${dbBuilt}\n`,
);
console.log(`Total matches: **${matches.length}**. Findings do not fail CI; triage follows docs/deployment/docker.md.\n`);
console.log("| Severity | Matches | Fix available |");
console.log("| --- | ---: | ---: |");
for (const name of severityOrder) {
  console.log(`| ${name} | ${counts[name].total} | ${counts[name].fixable} |`);
}

const detailed = rows.filter((row) => row.severity === "Critical" || row.severity === "High");
if (detailed.length > 0) {
  console.log(`\n### Critical and High matches (first ${Math.min(detailLimit, detailed.length)} of ${detailed.length})\n`);
  console.log("| Severity | Vulnerability | Package | Installed | Type | Fix |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const row of detailed.slice(0, detailLimit)) {
    console.log(
      `| ${row.severity} | ${cell(row.id)} | ${cell(row.name)} | ${cell(row.version)} | ${cell(row.type)} | ${cell(row.fix)} |`,
    );
  }
}
console.log("\nThe complete JSON report is uploaded as the `image-vulnerability-scan` artifact.");
