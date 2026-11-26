#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const targetDir = path.resolve(process.cwd(), args.find((a) => !a.startsWith("--")) ?? ".");

const IGNORE_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", ".bun"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const RULES = [
  {
    id: "EXPLICIT_ANY",
    regex: /(?::\s*any\b|\bas\s+any\b|<any>)/g,
    message: "Forbidden TypeScript `any` type detected.",
  },
  {
    id: "GOOGLE_API_KEY_LEAK",
    regex: /AIza[0-9A-Za-z_-]{35}/g,
    message: "Hardcoded Google/Gemini API key detected.",
  },
  {
    id: "GENERIC_SECRET_LEAK",
    regex: /(?:SARVAM_API_KEY|GEMINI_API_KEY|OPENAI_API_KEY)\s*=\s*["'][^"'$]{10,}["']/g,
    message: "Hardcoded secret assignment detected.",
  },
  {
    id: "SLOP_PLACEHOLDER",
    regex: /\b(?:TODO|FIXME|PLACEHOLDER_DATA|MOCK_RESPONSE)\b/g,
    message: "Unfinished placeholder or mock marker detected.",
  },
];

const findings = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!CODE_EXTS.has(ext)) continue;

    // Skip self when scanning harness repo
    if (full.endsWith("audit-static.mjs") || full.endsWith("validate-harness.mjs")) continue;

    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const rule of RULES) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(line)) {
          findings.push({
            file: path.relative(targetDir, full).replaceAll("\\", "/"),
            line: idx + 1,
            rule: rule.id,
            message: rule.message,
          });
        }
      }
    });
  }
}

scanDir(targetDir);

if (findings.length > 0) {
  console.error(`STATIC_AUDIT_FAILED (${findings.length} issues):`);
  for (const f of findings) {
    console.error(`  [${f.rule}] ${f.file}:${f.line} — ${f.message}`);
  }
  process.exit(1);
}

console.log(`STATIC_AUDIT_PASSED: 0 violations in ${targetDir}`);
