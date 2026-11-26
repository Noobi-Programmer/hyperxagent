#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const errors = [];
const MAX_MD_LINES = 130;

const REQUIRED_PATHS = [
  "plugin.json",
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",
  "LICENSE",
  "CONTRIBUTING.md",
  "README.md",
  "package.json",
  ".github/workflows/ci.yml",
  "mcp/mcp_config.template.json",
  "scripts/install-harness.mjs",
  "scripts/validate-harness.mjs",
  "scripts/setup-worktrees.sh",
  "templates/geminiPool.ts",
  ".agents/agents/architect.md",
  ".agents/agents/backend-voice.md",
  ".agents/agents/frontend-ui.md",
  ".agents/agents/research-scout.md",
  ".agents/agents/qa-adversarial.md",
  ".agents/skills/contract-architect/SKILL.md",
  ".agents/skills/contract-architect/references/schema-rules.md",
  ".agents/skills/sarvam-voice-pipeline/SKILL.md",
  ".agents/skills/sarvam-voice-pipeline/references/sarvam-api-specs.md",
  ".agents/skills/google-ai-search/SKILL.md",
  ".agents/skills/accessible-clinical-ui/SKILL.md",
  ".agents/skills/adversarial-qa/SKILL.md",
  ".agents/skills/adversarial-qa/scripts/audit-static.mjs",
  ".agents/workflows/build-mvp.md",
  ".agents/workflows/deep-research.md",
];

// 1. Verify exact directory structure
for (const rel of REQUIRED_PATHS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`MISSING_FILE: ${rel}`);
  }
}

// 2. Validate plugin.json strict kebab-case & schema keys
try {
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin.json"), "utf8"));
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(plugin.name ?? "")) {
    errors.push(`INVALID_PLUGIN_NAME: "${plugin.name}" must be kebab-case.`);
  }
  if (!plugin.version || !plugin.description || !plugin.paths) {
    errors.push("INVALID_PLUGIN_MANIFEST: missing version, description, or paths.");
  }
} catch (err) {
  errors.push(`PLUGIN_JSON_PARSE_ERROR: ${err.message}`);
}

// 3. Validate YAML frontmatter on agents, skills, workflows & line caps
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      meta[k] = v;
    }
  }
  return meta;
}

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{35}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /ghp_[A-Za-z0-9]{36}/g,
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const rel = path.relative(ROOT, full).replaceAll("\\", "/");
    const content = fs.readFileSync(full, "utf8");

    // Secret leak scan
    for (const pat of SECRET_PATTERNS) {
      if (pat.test(content)) {
        errors.push(`SECRET_LEAK_DETECTED in ${rel}`);
      }
    }

    if (rel.endsWith(".md")) {
      const lineCount = content.split(/\r?\n/).length;
      if (lineCount > MAX_MD_LINES) {
        errors.push(`LINE_CAP_EXCEEDED (${lineCount} > ${MAX_MD_LINES}): ${rel}`);
      }
    }

    if (rel.startsWith(".agents/agents/") && rel.endsWith(".md")) {
      const fm = parseFrontmatter(content);
      const expectedName = path.basename(rel, ".md");
      if (!fm) {
        errors.push(`MISSING_FRONTMATTER: ${rel}`);
      } else {
        if (fm.name !== expectedName) {
          errors.push(`AGENT_NAME_MISMATCH in ${rel}: got "${fm.name}", expected "${expectedName}"`);
        }
        if (fm.subagent !== "true") {
          errors.push(`AGENT_SUBAGENT_FLAG in ${rel}: subagent must be true`);
        }
        if (!fm.description) {
          errors.push(`AGENT_MISSING_DESCRIPTION: ${rel}`);
        }
      }
    }

    if (rel.startsWith(".agents/skills/") && entry.name === "SKILL.md") {
      const fm = parseFrontmatter(content);
      const expectedSkill = path.basename(path.dirname(rel));
      if (!fm || fm.name !== expectedSkill || !fm.description) {
        errors.push(`INVALID_SKILL_FRONTMATTER: ${rel}`);
      }
    }

    if (rel.startsWith(".agents/workflows/") && rel.endsWith(".md")) {
      const fm = parseFrontmatter(content);
      if (!fm || !fm.description) {
        errors.push(`INVALID_WORKFLOW_FRONTMATTER: ${rel}`);
      }
    }
  }
}

walk(ROOT);

if (errors.length > 0) {
  console.error("Validation FAILED:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Validation PASSED: All ${REQUIRED_PATHS.length} harness artifacts, YAML headers, line caps, and secret checks clean.`);
