// Cross-run comparisons for `summarize`: paired TS-S and TS-W differences by order index,
// traced against clean and clean against bare, and parity per path. Pure functions; every number
// is reported as computed and none is compared with a limit.
import { NOT_APPLICABLE, UNAVAILABLE, browserArgsOf, browserChannelOf, computeStats, viewportOf } from "./lib.mjs";

/** [TS-S phase, TS-W phase] pairs that measure the same step of the pipeline. */
export const PAIR_PHASES = [
  ["job.total", "pool.compute-metric"],
  ["pool.compute-metric", "pool.compute-metric"],
  ["job.submit-to-accepted", "job.submit-to-accepted"],
  ["app.worker-compute-metric", "app.worker-compute-metric"],
  ["app.input-to-commit", "app.input-to-commit"],
];

export const OVERHEAD_PHASES = ["pool.compute-metric", "job.submit-to-accepted", "app.worker-compute-metric", "app.input-to-commit"];

function valuesOf(samples, phase, warm) {
  return samples.filter((sample) => sample.phase === phase && sample.outcome === "ok" && sample.warm === warm).map((sample) => sample.duration);
}

function difference(left, right) {
  if (left.N === 0 || right.N === 0) return UNAVAILABLE;
  return { p50: left.p50 - right.p50, p95: left.p95 - right.p95, p99: left.p99 - right.p99 };
}

/** Runs are `{ entry, samples }`, passed timing runs only. Pairs match on everything but the variant and order index. */
export function pairedDifferences(runs) {
  const buckets = new Map();
  for (const run of runs) {
    const { entry } = run;
    const key = JSON.stringify([entry.case, entry.pass, entry.boundary, entry.audio, entry.build, entry.orderIndex, entry.driver ?? "not-applicable", browserChannelOf(entry), viewportOf(entry), JSON.stringify(browserArgsOf(entry))]);
    if (!buckets.has(key)) buckets.set(key, { TS_S: null, TS_W: null });
    const slot = entry.variant === "TS-S" ? "TS_S" : "TS_W";
    buckets.get(key)[slot] ??= run;
  }
  const pairs = [];
  for (const [key, slot] of buckets) {
    if (!slot.TS_S || !slot.TS_W) continue;
    const [caseId, pass, boundary, audio, build, orderIndex, driver, browserChannel, viewport, browserArgs] = JSON.parse(key);
    const phases = {};
    for (const [serialPhase, poolPhase] of PAIR_PHASES) {
      const label = serialPhase === poolPhase ? serialPhase : `${serialPhase} (TS-S) against ${poolPhase} (TS-W)`;
      const block = {};
      for (const [name, warm] of [["warm", true], ["cold", false]]) {
        const serial = computeStats(valuesOf(slot.TS_S.samples, serialPhase, warm));
        const pooled = computeStats(valuesOf(slot.TS_W.samples, poolPhase, warm));
        if (serial.N === 0 || pooled.N === 0) continue;
        block[name] = { tsS: serial, tsW: pooled, tsWMinusTsS: difference(pooled, serial) };
      }
      if (Object.keys(block).length > 0) phases[label] = block;
    }
    pairs.push({ case: caseId, pass, boundary, audio, build, driver, browserChannel, viewport, browserArgs: JSON.parse(browserArgs), orderIndex, tsS: slot.TS_S.entry.runId, tsW: slot.TS_W.entry.runId, phases });
  }
  return pairs.sort((a, b) => (JSON.stringify([a.case, a.orderIndex]) < JSON.stringify([b.case, b.orderIndex]) ? -1 : 1));
}

/** Groups come from buildGroups. Compares groups that differ only in pass. */
export function overheadComparisons(groups) {
  const byRest = new Map();
  for (const group of groups) {
    const { pass, ...rest } = group.key;
    const key = JSON.stringify(rest);
    if (!byRest.has(key)) byRest.set(key, {});
    byRest.get(key)[pass] = group;
  }
  const rows = [];
  for (const [key, passes] of byRest) {
    for (const [higher, lower] of [["traced", "clean"], ["clean", "bare"]]) {
      if (!passes[higher] || !passes[lower]) continue;
      const phases = {};
      for (const phase of OVERHEAD_PHASES) {
        const left = passes[higher].pooled[phase];
        const right = passes[lower].pooled[phase];
        if (!left || !right) continue;
        const block = {};
        for (const temperature of ["warm", "cold"]) {
          if (left[temperature].N === 0 || right[temperature].N === 0) continue;
          block[temperature] = { [higher]: left[temperature], [lower]: right[temperature], difference: difference(left[temperature], right[temperature]) };
        }
        if (Object.keys(block).length > 0) phases[phase] = block;
      }
      rows.push({ comparison: `${higher} minus ${lower}`, group: JSON.parse(key), phases, runs: { [higher]: passes[higher].runIds, [lower]: passes[lower].runIds } });
    }
  }
  return rows;
}

/** One row per parity run. Bit-exact and rule violations are separate columns and never merged. */
export function parityRows(parityRuns) {
  return parityRuns
    .map((run) => {
      const verdict = run.parity === NOT_APPLICABLE || run.parity === UNAVAILABLE ? null : run.parity;
      return {
        runId: run.runId,
        case: run.case,
        path: run.path,
        status: run.status,
        steps: verdict ? `${verdict.stepCount} of ${verdict.expectedStepCount}` : UNAVAILABLE,
        bitExact: verdict ? verdict.bitExact : UNAVAILABLE,
        differingLeaves: verdict ? verdict.differingLeafCount : UNAVAILABLE,
        leavesCompared: verdict ? verdict.leafCount : UNAVAILABLE,
        ruleViolations: verdict ? verdict.violationCount : UNAVAILABLE,
        rulesOk: verdict ? verdict.rulesOk : UNAVAILABLE,
      };
    })
    .sort((a, b) => (`${a.case}${a.path}` < `${b.case}${b.path}` ? -1 : 1));
}

const fmt = (value) => (typeof value === "number" ? value.toFixed(3) : String(value));

export function renderComparisons({ paired, overhead, parity }) {
  const lines = [];
  lines.push("## Parity per path", "");
  if (parity.length === 0) lines.push("No parity runs.", "");
  else {
    lines.push("| case | path | status | steps | bit-exact | differing leaves | leaves compared | rule violations |", "| --- | --- | --- | --- | --- | --- | ---: | ---: |");
    for (const row of parity) {
      lines.push(`| ${row.case} | ${row.path} | ${row.status} | ${row.steps} | ${row.bitExact} | ${row.differingLeaves} | ${row.leavesCompared} | ${row.ruleViolations} |`);
    }
    lines.push("", "Bit-exact false with zero rule violations means every difference is inside the comparison rules but the bytes are not identical.", "");
  }
  lines.push("## Paired TS-S and TS-W differences", "");
  if (paired.length === 0) lines.push("No pair of TS-S and TS-W runs shares a case, pass, boundary and order index.", "");
  for (const pair of paired) {
    lines.push(`### ${pair.case} pass=${pair.pass} boundary=${pair.boundary} order=${pair.orderIndex} (TS-S ${pair.tsS}, TS-W ${pair.tsW})`, "");
    lines.push("| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |", "| --- | --- | ---: | ---: | ---: | ---: | ---: |");
    for (const [phase, block] of Object.entries(pair.phases)) {
      for (const [temperature, row] of Object.entries(block)) {
        const d = row.tsWMinusTsS;
        lines.push(`| ${phase} | ${temperature} | ${row.tsS.N} | ${row.tsW.N} | ${d === UNAVAILABLE ? d : fmt(d.p50)} | ${d === UNAVAILABLE ? d : fmt(d.p95)} | ${d === UNAVAILABLE ? d : fmt(d.p99)} |`);
      }
    }
    lines.push("");
  }
  lines.push("## Pass overhead", "");
  if (overhead.length === 0) lines.push("No group has two passes to compare.", "");
  for (const row of overhead) {
    lines.push(`### ${row.comparison}: ${JSON.stringify(row.group)}`, "");
    lines.push("| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |", "| --- | --- | ---: | ---: | ---: | ---: | ---: |");
    for (const [phase, block] of Object.entries(row.phases)) {
      for (const [temperature, cell] of Object.entries(block)) {
        const [higher, lower] = row.comparison.split(" minus ");
        const d = cell.difference;
        lines.push(`| ${phase} | ${temperature} | ${cell[higher].N} | ${cell[lower].N} | ${d === UNAVAILABLE ? d : fmt(d.p50)} | ${d === UNAVAILABLE ? d : fmt(d.p95)} | ${d === UNAVAILABLE ? d : fmt(d.p99)} |`);
      }
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
