import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const basePortRaw = process.env.PANEL_BASE_PORT;
const basePortParsed = Number.parseInt(basePortRaw ?? "3000", 10);
const basePort = Number.isNaN(basePortParsed) ? 3000 : basePortParsed;

const panels = [
  {
    name: "super-admin-panel",
    cwd: path.join(repoRoot, "apps", "super-admin-panel"),
    port: basePort
  },
  {
    name: "mahalla-panel",
    cwd: path.join(repoRoot, "apps", "mahalla-panel"),
    port: basePort + 1
  },
  {
    name: "resident-panel",
    cwd: path.join(repoRoot, "apps", "resident-panel"),
    port: basePort + 2
  },
  {
    name: "hokimiyat-panel",
    cwd: path.join(repoRoot, "apps", "hokimiyat-panel"),
    port: basePort + 3
  }
];

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];

console.log("Starting panel dev servers...");
for (const panel of panels) {
  console.log(`- ${panel.name}: http://localhost:${panel.port}`);
  const child = spawn(npmCmd, ["run", "dev", "--", "--port", String(panel.port)], {
    cwd: panel.cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${panel.name} exited with code ${code ?? "unknown"}`);
      shutdown(code ?? 1);
    }
  });

  children.push(child);
}

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(exitCode), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

