import * as fs from "fs";
import * as path from "path";

export interface CheckResult {
  missing: string[];
  extra: string[];
  present: string[];
}

/**
 * Compare a .env file against a .env.example template,
 * returning missing keys, extra keys, and keys present in both.
 */
export function checkEnvAgainstExample(
  envPath: string,
  examplePath: string
): CheckResult {
  const envKeys = parseKeys(envPath);
  const exampleKeys = parseKeys(examplePath);

  const envSet = new Set(envKeys);
  const exampleSet = new Set(exampleKeys);

  const missing = exampleKeys.filter((k) => !envSet.has(k));
  const extra = envKeys.filter((k) => !exampleSet.has(k));
  const present = envKeys.filter((k) => exampleSet.has(k));

  return { missing, extra, present };
}

function parseKeys(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  const keys: string[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      keys.push(trimmed.slice(0, eqIdx).trim());
    }
  }
  return keys;
}

export function formatCheckResult(result: CheckResult): string {
  const lines: string[] = [];

  if (result.missing.length === 0 && result.extra.length === 0) {
    lines.push("✅ .env is in sync with .env.example");
  } else {
    if (result.missing.length > 0) {
      lines.push("❌ Missing keys (in .env.example but not in .env):");
      for (const k of result.missing) lines.push(`   - ${k}`);
    }
    if (result.extra.length > 0) {
      lines.push("⚠️  Extra keys (in .env but not in .env.example):");
      for (const k of result.extra) lines.push(`   + ${k}`);
    }
  }

  lines.push(`\n📋 Present: ${result.present.length} key(s) matched`);
  return lines.join("\n");
}
