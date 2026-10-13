import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Exercises Next's real compiler, including the forbidden Server Component case.
// Temporary fixtures use installed dependencies, without installation or network.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
// Turbopack requires the fixture and the real dependency tree inside its root,
// including on Windows where the system temp directory can be on another drive.
const tempRoot = await realpath(projectRoot);
const fixtureRoot = await mkdtemp(path.join(tempRoot, ".tmp-client-marker-"));
const boundary = path.relative(tempRoot, await realpath(fixtureRoot));
assert.ok(boundary.startsWith(".tmp-client-marker-") && !boundary.includes(path.sep), "Fixture must be a direct child of the project directory");

function build(directory, compiler) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, "build", ...(compiler === "webpack" ? ["--webpack"] : [])], {
      cwd: directory,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let overflow = false;
    const append = (bytes) => {
      if (output.length + bytes.length > 2 * 1024 * 1024) {
        overflow = true;
        child.kill();
        return;
      }
      output += bytes.toString();
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    const timeout = setTimeout(() => child.kill(), 120_000);
    child.on("error", (error) => { clearTimeout(timeout); reject(error); });
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (overflow || signal) reject(new Error(`Next marker fixture terminated: ${overflow ? "output limit" : signal}`));
      else resolve({ code, output });
    });
  });
}

try {
  for (const compiler of ["turbopack", "webpack"]) {
    for (const mode of ["client", "server"]) {
      const directory = path.join(fixtureRoot, `${compiler}-${mode}`);
      await mkdir(path.join(directory, "app"), { recursive: true });
      await symlink(path.join(projectRoot, "node_modules"), path.join(directory, "node_modules"), process.platform === "win32" ? "junction" : "dir");
      await writeFile(path.join(directory, "package.json"), JSON.stringify({ name: `marker-${mode}-fixture`, private: true, dependencies: { next: "16.3.8", react: "19.2.7", "react-dom": "19.2.7" } }));
      await writeFile(path.join(directory, "next.config.mjs"), `export default { agentRules: false, turbopack: { root: ${JSON.stringify(projectRoot)} } };\n`);
      await writeFile(path.join(directory, "app", "layout.js"), "export default function Layout({ children }) { return <html><body>{children}</body></html>; }\n");
      await writeFile(path.join(directory, "app", "page.js"), `${mode === "client" ? '"use client";\n' : ""}import "client-only";\nexport default function Page() { return <p>Marker boundary fixture</p>; }\n`);
      const result = await build(directory, compiler);
      if (mode === "client") {
        assert.equal(result.code, 0, `Valid Client Component marker must build:\n${result.output}`);
      } else {
        assert.notEqual(result.code, 0, "Forbidden Server Component marker must fail compilation");
        assert.match(result.output, /client-only[\s\S]*(?:cannot be imported from a Server Component|only works in a Client Component)/, "Failure must be the preserved client/server boundary guard");
      }
      console.log(`PASS Next ${compiler} ${mode} marker boundary: ${mode === "client" ? "build accepted" : "build rejected as required"}`);
    }
  }
} finally {
  // Verified exact mkdtemp child above; Node removes directory links themselves.
  await rm(fixtureRoot, { recursive: true, force: true });
}
