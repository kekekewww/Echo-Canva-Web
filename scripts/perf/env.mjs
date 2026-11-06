import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { arch, cpus, release, totalmem } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { collectGitInfo } from "../corpus/lib.mjs";
import { NOT_APPLICABLE, UNAVAILABLE } from "./lib.mjs";

const execFileAsync = promisify(execFile);

const HARDWARE_SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$r = [ordered]@{}
$os = Get-CimInstance Win32_OperatingSystem
if ($os) { $r.osName = $os.Caption; $r.osBuild = $os.BuildNumber }
$procs = @(Get-CimInstance Win32_Processor)
if ($procs.Count -gt 0) {
  $r.cpuModel = ($procs[0].Name).Trim()
  $r.physicalCores = ($procs | Measure-Object -Property NumberOfCores -Sum).Sum
  $r.logicalCores = ($procs | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
}
$cs = Get-CimInstance Win32_ComputerSystem
if ($cs) { $r.ramGB = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2) }
$scheme = (powercfg /getactivescheme) -join ' '
if ($scheme -match '\((.+)\)') { $r.powerScheme = $Matches[1] }
Add-Type -AssemblyName System.Windows.Forms
$power = [System.Windows.Forms.SystemInformation]::PowerStatus
if ($power) {
  $r.powerLine = [string]$power.PowerLineStatus
  $r.batteryChargeStatus = [string]$power.BatteryChargeStatus
  $r.batteryPercent = [int]($power.BatteryLifePercent * 100)
}
$temps = @(Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature)
if ($temps.Count -gt 0) { $r.acpiThermalZoneC = [math]::Round(($temps[0].CurrentTemperature / 10) - 273.15, 1) }
$r | ConvertTo-Json -Compress
`;

const ACTIVITY_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$seconds = [int]$args[0]
$forceFallback = ($args.Count -gt 1 -and $args[1] -eq '1')
$logical = [Environment]::ProcessorCount
$out = [ordered]@{}

function Measure-WithCounters {
  $samples = Get-Counter -ErrorAction SilentlyContinue -Counter '\Processor(_Total)\% Processor Time', '\Process(*)\% Processor Time', '\Process(*)\IO Write Bytes/sec' -SampleInterval 1 -MaxSamples $seconds
  if ($null -eq $samples) { throw 'no samples' }
  $machine = @()
  $cpu = @{}
  $write = @{}
  foreach ($sample in $samples) {
    foreach ($item in $sample.CounterSamples) {
      $path = $item.Path
      if ($path -like '*\processor(_total)\*') { $machine += $item.CookedValue; continue }
      $name = ($item.InstanceName -replace '#\d+$', '')
      if ($name -eq '_total' -or $name -eq 'idle') { continue }
      if ($path -like '*% processor time') { $cpu[$name] = [double]$cpu[$name] + ($item.CookedValue / $logical / $seconds) }
      elseif ($path -like '*io write bytes/sec') { $write[$name] = [double]$write[$name] + ($item.CookedValue / 1MB / $seconds) }
    }
  }
  return @{ machine = [math]::Round(($machine | Measure-Object -Average).Average, 3); cpu = $cpu; write = $write }
}

# Two Win32_Process / Get-Process snapshots one interval apart. Machine percent is the sum of the
# per-process CPU deltas, so it excludes interrupt and idle accounting that the counter reports.
function Measure-WithProcessSnapshots {
  $first = @{}
  foreach ($p in (Get-CimInstance Win32_Process)) { $first[[int]$p.ProcessId] = [double]$p.WriteTransferCount }
  $cpuFirst = @{}
  foreach ($p in (Get-Process)) { if ($null -ne $p.CPU) { $cpuFirst[$p.Id] = [double]$p.CPU } }
  Start-Sleep -Seconds $seconds
  $cpu = @{}
  $write = @{}
  $total = 0.0
  foreach ($p in (Get-Process)) {
    if ($null -eq $p.CPU) { continue }
    $before = $cpuFirst[$p.Id]
    if ($null -eq $before) { continue }
    $delta = [double]$p.CPU - $before
    if ($delta -lt 0) { continue }
    $name = $p.ProcessName.ToLowerInvariant()
    $cpu[$name] = [double]$cpu[$name] + ($delta / $logical / $seconds * 100)
    $total += $delta
  }
  foreach ($p in (Get-CimInstance Win32_Process)) {
    $before = $first[[int]$p.ProcessId]
    if ($null -eq $before) { continue }
    $delta = [double]$p.WriteTransferCount - $before
    if ($delta -lt 0) { continue }
    $name = ([IO.Path]::GetFileNameWithoutExtension($p.Name)).ToLowerInvariant()
    $write[$name] = [double]$write[$name] + ($delta / 1MB / $seconds)
  }
  return @{ machine = [math]::Round($total / $logical / $seconds * 100, 3); cpu = $cpu; write = $write }
}

$measure = $null
$method = $null
if (-not $forceFallback) {
  for ($attempt = 0; $attempt -lt 2 -and $null -eq $measure; $attempt++) {
    try { $measure = Measure-WithCounters; $method = 'get-counter' } catch { $measure = $null }
  }
}
if ($null -eq $measure) {
  try { $measure = Measure-WithProcessSnapshots; $method = 'win32-process' } catch { $measure = $null }
}
if ($null -eq $measure) {
  $out.error = 'both-methods-failed'
} else {
  $out.method = $method
  $out.machineCpuPercent = $measure.machine
  $out.topProcesses = @($measure.cpu.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 | ForEach-Object {
    [ordered]@{ name = $_.Key; cpuPercentOfMachine = [math]::Round($_.Value, 3); writeMBps = [math]::Round([double]$measure.write[$_.Key], 3) }
  })
}
$out.driveFreeGB = [ordered]@{}
foreach ($d in (Get-PSDrive -PSProvider FileSystem)) { if ($null -ne $d.Free) { $out.driveFreeGB[$d.Name] = [math]::Round($d.Free / 1GB, 2) } }
$out | ConvertTo-Json -Compress -Depth 5
`;

async function runPowerShell(script, args = []) {
  const dir = process.env.TEMP ?? process.env.TMPDIR;
  if (!dir) throw new Error("TEMP is not set; set TEMP, TMP and TMPDIR inside the worktree before running.");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `perf-env-${process.pid}-${Date.now()}.ps1`);
  writeFileSync(file, script, "utf8");
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", file, ...args],
      { timeout: 60_000, windowsHide: true, maxBuffer: 4 * 1024 * 1024, encoding: "utf8" },
    );
    return JSON.parse(stdout.trim());
  } finally {
    rmSync(file, { force: true });
  }
}

function orUnavailable(value) {
  return value === undefined || value === null || value === "" ? UNAVAILABLE : value;
}

function readVersion(repoRoot, packageName) {
  try {
    return JSON.parse(readFileSync(join(repoRoot, "node_modules", packageName, "package.json"), "utf8")).version;
  } catch {
    return UNAVAILABLE;
  }
}

/** Process names and numbers only. No host name, user name, command line or path is collected. */
export async function collectEnvironment(repoRoot) {
  const processors = cpus();
  let hardware = {};
  let hardwareError = null;
  if (process.platform === "win32") {
    try {
      hardware = await runPowerShell(HARDWARE_SCRIPT);
    } catch (error) {
      hardwareError = error instanceof Error ? error.message.split("\n")[0] : String(error);
    }
  }
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const git = collectGitInfo(repoRoot, null);
  const now = new Date();
  return {
    schema: "ec102.environment.v1",
    date: now.toISOString(),
    timezoneOffsetMinutes: -now.getTimezoneOffset(),
    cpuModel: orUnavailable(hardware.cpuModel ?? (processors[0]?.model?.trim() ?? UNAVAILABLE)),
    physicalCores: orUnavailable(hardware.physicalCores),
    logicalCores: orUnavailable(hardware.logicalCores ?? (processors.length || undefined)),
    ramGB: orUnavailable(hardware.ramGB ?? Math.round((totalmem() / 1024 ** 3) * 100) / 100),
    os: {
      name: orUnavailable(hardware.osName ?? process.platform),
      build: orUnavailable(hardware.osBuild ?? release()),
      arch: arch(),
    },
    power: {
      scheme: orUnavailable(hardware.powerScheme),
      line: orUnavailable(hardware.powerLine),
      batteryChargeStatus: orUnavailable(hardware.batteryChargeStatus),
      batteryPercent: hardware.batteryChargeStatus === "NoSystemBattery" ? NOT_APPLICABLE : orUnavailable(hardware.batteryPercent),
    },
    acpiThermalZoneC: orUnavailable(hardware.acpiThermalZoneC),
    versions: {
      node: process.version,
      pnpm: typeof packageJson.packageManager === "string" ? packageJson.packageManager.replace(/^pnpm@/, "") : UNAVAILABLE,
      playwright: readVersion(repoRoot, "@playwright/test"),
    },
    git: {
      sha: git.gitHead,
      dirty: git.gitDirty === UNAVAILABLE ? UNAVAILABLE : git.gitDirty.length > 0,
    },
    browser: NOT_APPLICABLE,
    ...(hardwareError ? { collectionNote: `windows collection failed: ${hardwareError}` } : {}),
  };
}

/**
 * Samples machine activity for `seconds` seconds. Call it outside any measured window: it
 * runs before the measured process starts and after it exits.
 */
export async function sampleOtherActivity(seconds = 3, { forceFallback = false } = {}) {
  const none = { seconds, method: UNAVAILABLE, machineCpuPercent: UNAVAILABLE, topProcesses: UNAVAILABLE, driveFreeGB: UNAVAILABLE };
  if (process.platform !== "win32") return none;
  try {
    const result = await runPowerShell(ACTIVITY_SCRIPT, [String(seconds), forceFallback ? "1" : "0"]);
    if (result.error) return { ...none, driveFreeGB: orUnavailable(result.driveFreeGB), note: result.error };
    return {
      seconds,
      method: result.method,
      machineCpuPercent: orUnavailable(result.machineCpuPercent),
      topProcesses: Array.isArray(result.topProcesses) ? result.topProcesses : [result.topProcesses].filter(Boolean),
      driveFreeGB: orUnavailable(result.driveFreeGB),
    };
  } catch {
    return none;
  }
}
