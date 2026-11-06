import { createHash } from "node:crypto";

const MAX_FIRST_VIOLATIONS = 20;

// Raw absolute/relative errors per report and class. Percentiles cannot be
// merged from summaries, so summarizeReports recomputes them from these.
const rawErrors = new WeakMap();

function escapePointerSegment(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Serializes a value deterministically: keys sorted by UTF-16 code unit,
 * 2-space indent, trailing newline. Non-finite numbers throw with their path.
 */
export function canonicalize(value) {
  const negativeZeroPaths = [];

  function write(node, path, indent) {
    if (node === null) return "null";
    switch (typeof node) {
      case "string":
      case "boolean":
        return JSON.stringify(node);
      case "number":
        if (!Number.isFinite(node)) {
          throw new Error(`Non-finite number ${String(node)} at ${path || "/"}`);
        }
        if (Object.is(node, -0)) negativeZeroPaths.push(path || "/");
        return JSON.stringify(node);
      case "undefined":
        return "null";
      case "object":
        break;
      default:
        throw new Error(`Unsupported value of type ${typeof node} at ${path || "/"}`);
    }
    const inner = `${indent}  `;
    if (Array.isArray(node)) {
      if (node.length === 0) return "[]";
      const items = node.map(
        (item, index) => `${inner}${write(item, `${path}/${index}`, inner)}`,
      );
      return `[\n${items.join(",\n")}\n${indent}]`;
    }
    const keys = Object.keys(node)
      .filter((key) => node[key] !== undefined)
      .sort();
    if (keys.length === 0) return "{}";
    const members = keys.map(
      (key) =>
        `${inner}${JSON.stringify(key)}: ${write(node[key], `${path}/${escapePointerSegment(key)}`, inner)}`,
    );
    return `{\n${members.join(",\n")}\n${indent}}`;
  }

  return { text: `${write(value, "", "")}\n`, negativeZeroPaths };
}

export function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function aggregateSha256(caseHashes) {
  const lines = Object.keys(caseHashes)
    .sort()
    .map((id) => `${id} ${caseHashes[id]}\n`);
  return sha256Hex(lines.join(""));
}

export function validateRules(rules) {
  for (const [name, fieldClass] of Object.entries(rules.classes)) {
    if (fieldClass.compare !== "exact" && !(typeof fieldClass.unit === "string" && fieldClass.unit.length > 0)) {
      throw new Error(`Class "${name}" compares as ${fieldClass.compare} and needs a non-empty unit`);
    }
  }
  for (const rule of rules.rules) {
    if (!Object.hasOwn(rules.classes, rule.class)) {
      throw new Error(`Rule "${rule.path}" names unknown class "${rule.class}"`);
    }
  }
}

function leafType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "empty-array";
  if (isPlainObject(value)) return "empty-object";
  return typeof value;
}

// Collects leaves (primitives plus empty containers) and the container kind of
// every non-empty node, so [] vs {} and array vs object are both caught.
function collect(value, path, leaves, containers) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      leaves.set(path, value);
      return;
    }
    containers.set(path, "array");
    value.forEach((item, index) => collect(item, `${path}/${index}`, leaves, containers));
    return;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined);
    if (keys.length === 0) {
      leaves.set(path, value);
      return;
    }
    containers.set(path, "object");
    for (const key of keys) {
      collect(value[key], `${path}/${escapePointerSegment(key)}`, leaves, containers);
    }
    return;
  }
  leaves.set(path, value);
}

function pathMatches(pattern, path) {
  const patternSegments = pattern.split("/");
  const pathSegments = path.split("/");
  return (
    patternSegments.length === pathSegments.length &&
    patternSegments.every((segment, index) => segment === "*" || segment === pathSegments[index])
  );
}

function wrapDifference(difference, period) {
  return difference - period * Math.floor(difference / period + 0.5);
}

function judgeNumber(fieldClass, expected, actual) {
  const absError =
    fieldClass.compare === "circular"
      ? Math.abs(wrapDifference(actual - expected, fieldClass.period))
      : Math.abs(actual - expected);
  let pass;
  switch (fieldClass.compare) {
    case "decimal":
      pass = Number(actual.toFixed(fieldClass.decimals)) === Number(expected.toFixed(fieldClass.decimals));
      break;
    case "tolerance": {
      const scale = Math.max(Math.abs(actual), Math.abs(expected));
      pass = absError <= Math.max(fieldClass.atol ?? 0, (fieldClass.rtol ?? 0) * scale);
      break;
    }
    case "circular":
      pass = absError <= (fieldClass.atol ?? 0);
      break;
    default:
      throw new Error(`Unknown compare mode "${fieldClass.compare}"`);
  }
  return { pass, absError };
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0;
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

function buildStats(errors, worst) {
  const abs = errors.map((entry) => entry.abs).sort((a, b) => a - b);
  const rels = errors.map((entry) => entry.rel).filter((rel) => rel !== null);
  return {
    count: abs.length,
    maxAbsError: abs.length === 0 ? 0 : abs[abs.length - 1],
    p50AbsError: percentile(abs, 0.5),
    p95AbsError: percentile(abs, 0.95),
    maxRelError: rels.length === 0 ? null : Math.max(...rels),
    worst,
  };
}

export function compareOutputs(expected, actual, rules, context) {
  validateRules(rules);
  const expectedLeaves = new Map();
  const expectedContainers = new Map();
  const actualLeaves = new Map();
  const actualContainers = new Map();
  collect(expected, "", expectedLeaves, expectedContainers);
  collect(actual, "", actualLeaves, actualContainers);

  const violations = [];
  const errorsByClass = new Map();
  const worstByClass = new Map();
  const applicable = rules.rules.filter((rule) => rule.kinds.includes(context.kind));

  for (const [path, expectedKind] of expectedContainers) {
    const actualKind = actualContainers.get(path);
    if (actualKind !== undefined && actualKind !== expectedKind) {
      violations.push({ type: "structure", path, detail: `container changed from ${expectedKind} to ${actualKind}` });
    }
  }

  const paths = [...new Set([...expectedLeaves.keys(), ...actualLeaves.keys()])].sort();
  for (const path of paths) {
    const hasExpected = expectedLeaves.has(path);
    const hasActual = actualLeaves.has(path);
    const expectedValue = expectedLeaves.get(path);
    const actualValue = actualLeaves.get(path);
    if (!hasExpected || !hasActual) {
      violations.push({
        type: "structure",
        path,
        ...(hasExpected ? { expected: expectedValue } : {}),
        ...(hasActual ? { actual: actualValue } : {}),
        detail: hasExpected ? "missing from actual" : "missing from expected",
      });
      continue;
    }
    if (leafType(expectedValue) !== leafType(actualValue)) {
      violations.push({
        type: "structure",
        path,
        expected: expectedValue,
        actual: actualValue,
        detail: `type changed from ${leafType(expectedValue)} to ${leafType(actualValue)}`,
      });
      continue;
    }

    const matches = applicable.filter((rule) => pathMatches(rule.path, path));
    if (matches.length !== 1) {
      violations.push({
        type: matches.length === 0 ? "unclassified" : "ambiguous",
        path,
        detail: matches.length === 0 ? "no rule matches" : `rules match: ${matches.map((rule) => rule.path).join(", ")}`,
      });
      continue;
    }

    const className = matches[0].class;
    const fieldClass = rules.classes[className];
    if (fieldClass.compare === "exact") {
      if (!Object.is(actualValue, expectedValue) && !(typeof actualValue === "object" && actualValue !== null)) {
        violations.push({ type: "discrete", path, expected: expectedValue, actual: actualValue, class: className });
      }
      continue;
    }
    if (typeof expectedValue !== "number" || typeof actualValue !== "number") {
      violations.push({
        type: "structure",
        path,
        expected: expectedValue,
        actual: actualValue,
        class: className,
        detail: `class "${className}" requires numbers`,
      });
      continue;
    }

    const { pass, absError } = judgeNumber(fieldClass, expectedValue, actualValue);
    const scale = Math.max(Math.abs(actualValue), Math.abs(expectedValue));
    if (!errorsByClass.has(className)) errorsByClass.set(className, []);
    errorsByClass.get(className).push({ abs: absError, rel: scale === 0 ? null : absError / scale });
    const worst = worstByClass.get(className);
    if (worst === undefined || absError > worst.abs) {
      worstByClass.set(className, {
        abs: absError,
        point: { caseId: context.caseId, path, expected: expectedValue, actual: actualValue },
      });
    }
    if (!pass) {
      violations.push({
        type: "continuous",
        path,
        expected: expectedValue,
        actual: actualValue,
        class: className,
        detail: `abs error ${absError}`,
      });
    }
  }

  const stats = {};
  const raw = {};
  for (const [className, errors] of errorsByClass) {
    stats[className] = buildStats(errors, worstByClass.get(className).point);
    raw[className] = errors;
  }

  const report = {
    caseId: context.caseId,
    kind: context.kind,
    ok: violations.length === 0,
    bitExact: canonicalize(expected).text === canonicalize(actual).text,
    leafCount: paths.length,
    violations,
    stats,
  };
  rawErrors.set(report, raw);
  return report;
}

export function summarizeReports(reports) {
  const merged = new Map();
  const worstAbs = new Map();
  const firstViolations = [];
  let violationCount = 0;
  let bitExactCases = 0;

  for (const report of reports) {
    const raw = rawErrors.get(report);
    if (raw === undefined) {
      throw new Error(`Report for case "${report.caseId}" was not produced by compareOutputs`);
    }
    if (report.bitExact) bitExactCases += 1;
    violationCount += report.violations.length;
    for (const violation of report.violations) {
      if (firstViolations.length < MAX_FIRST_VIOLATIONS) {
        firstViolations.push({ ...violation, caseId: report.caseId });
      }
    }
    for (const [className, errors] of Object.entries(raw)) {
      if (!merged.has(className)) merged.set(className, []);
      merged.get(className).push(...errors);
      const stats = report.stats[className];
      const current = worstAbs.get(className);
      if (current === undefined || stats.maxAbsError > current.abs) {
        worstAbs.set(className, { abs: stats.maxAbsError, point: stats.worst });
      }
    }
  }

  const stats = {};
  for (const [className, errors] of merged) {
    stats[className] = buildStats(errors, worstAbs.get(className).point);
  }
  return {
    ok: reports.every((report) => report.ok),
    caseCount: reports.length,
    bitExactCases,
    violationCount,
    firstViolations,
    stats,
  };
}
