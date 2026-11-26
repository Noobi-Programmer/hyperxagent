#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = path.resolve(__dirname, "..");

const targetArg = process.argv[2];
if (!targetArg) {
  console.error("Usage: bun run scripts/install-harness.mjs <target-repo-path>");
  process.exit(1);
}

const targetRoot = path.resolve(process.cwd(), targetArg);
if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error(`Target directory does not exist: ${targetRoot}`);
  process.exit(1);
}

function forceSymlink(src, dest) {
  if (fs.existsSync(dest) || fs.lstatSync(dest, { throwIfNoEntry: false })) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  const isDir = fs.statSync(src).isDirectory();
  try {
    const type = isDir ? (process.platform === "win32" ? "junction" : "dir") : "file";
    fs.symlinkSync(src, dest, type);
    console.log(`Linked: ${dest} -> ${src}`);
  } catch (err) {
    if (err && err.code === "EPERM") {
      if (isDir) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`Copied (symlink EPERM fallback): ${dest} <- ${src}`);
      return;
    }
    throw err;
  }
}

// 1. Symlink .agents, AGENTS.md, CLAUDE.md, and .cursorrules
forceSymlink(path.join(HARNESS_ROOT, ".agents"), path.join(targetRoot, ".agents"));
forceSymlink(path.join(HARNESS_ROOT, "AGENTS.md"), path.join(targetRoot, "AGENTS.md"));
forceSymlink(path.join(HARNESS_ROOT, "CLAUDE.md"), path.join(targetRoot, "CLAUDE.md"));
forceSymlink(path.join(HARNESS_ROOT, ".cursorrules"), path.join(targetRoot, ".cursorrules"));

// 2. Materialize resolved MCP config inside .antigravity/mcp_config.json
const antigravityDir = path.join(targetRoot, ".antigravity");
fs.mkdirSync(antigravityDir, { recursive: true });
const mcpTemplate = fs.readFileSync(
  path.join(HARNESS_ROOT, "mcp", "mcp_config.template.json"),
  "utf8"
);
const resolvedMcp = mcpTemplate
  .replaceAll("${PLUGIN_ROOT}", HARNESS_ROOT)
  .replaceAll("${WORKSPACE_ROOT}", targetRoot);
fs.writeFileSync(path.join(antigravityDir, "mcp_config.json"), resolvedMcp, "utf8");
console.log(`Generated: ${path.join(antigravityDir, "mcp_config.json")}`);

// 3. Copy geminiPool.ts into src/lib/geminiPool.ts if src/ exists
const srcLibDir = path.join(targetRoot, "src", "lib");
if (fs.existsSync(path.join(targetRoot, "src"))) {
  fs.mkdirSync(srcLibDir, { recursive: true });
  const destPool = path.join(srcLibDir, "geminiPool.ts");
  fs.copyFileSync(path.join(HARNESS_ROOT, "templates", "geminiPool.ts"), destPool);
  console.log(`Installed: ${destPool}`);
}

// 4. Ensure plans/ directory exists for Architect contract locks
const plansDir = path.join(targetRoot, "plans");
fs.mkdirSync(plansDir, { recursive: true });

console.log("\nhyperxagent installation complete.");
