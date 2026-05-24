import * as fs from "fs";
import * as path from "path";
import { isInitialized } from "./env-init";
import { loadConfig } from "./config";
import { keyExists } from "./keystore";

export interface DoctorCheck {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  healthy: boolean;
}

export async function runDoctor(cwd: string = process.cwd()): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  // Check 1: envsync initialized
  const initialized = await isInitialized(cwd);
  checks.push({
    name: "initialization",
    status: initialized ? "ok" : "error",
    message: initialized ? "envsync is initialized" : "envsync is not initialized — run `envsync init`",
  });

  // Check 2: config file readable
  try {
    const config = await loadConfig(cwd);
    checks.push({
      name: "config",
      status: "ok",
      message: `Config loaded (namespace: ${config.namespace ?? "default"})`,
    });
  } catch {
    checks.push({
      name: "config",
      status: "error",
      message: "Could not read config file",
    });
  }

  // Check 3: encryption key present
  const hasKey = await keyExists(cwd);
  checks.push({
    name: "encryption-key",
    status: hasKey ? "ok" : "error",
    message: hasKey ? "Encryption key found" : "No encryption key — run `envsync init` or accept an invite",
  });

  // Check 4: .env file exists
  const envPath = path.join(cwd, ".env");
  const envExists = fs.existsSync(envPath);
  checks.push({
    name: ".env-file",
    status: envExists ? "ok" : "warn",
    message: envExists ? ".env file found" : ".env file not found in project root",
  });

  // Check 5: .env in .gitignore
  const gitignorePath = path.join(cwd, ".gitignore");
  let gitignoreOk = false;
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf8");
    gitignoreOk = content.split("\n").some((line) => line.trim() === ".env");
  }
  checks.push({
    name: ".env-gitignored",
    status: gitignoreOk ? "ok" : "warn",
    message: gitignoreOk ? ".env is listed in .gitignore" : ".env is NOT in .gitignore — risk of accidental commit",
  });

  const healthy = checks.every((c) => c.status !== "error");
  return { checks, healthy };
}

export function formatDoctorReport(report: DoctorReport): string {
  const icon = (s: DoctorCheck["status"]) =>
    s === "ok" ? "✔" : s === "warn" ? "⚠" : "✖";
  const lines = report.checks.map((c) => `  ${icon(c.status)} [${c.name}] ${c.message}`);
  lines.unshift("envsync doctor:");
  lines.push("");
  lines.push(report.healthy ? "All checks passed." : "Some checks failed. Please review the issues above.");
  return lines.join("\n");
}
