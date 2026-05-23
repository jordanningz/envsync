import * as fs from "fs";
import * as path from "path";

export interface TemplateEntry {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

export function parseTemplate(content: string): TemplateEntry[] {
  const entries: TemplateEntry[] = [];
  const lines = content.split("\n");
  let pendingDescription: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) {
      pendingDescription = trimmed.slice(1).trim();
      continue;
    }

    if (!trimmed || !trimmed.includes("=")) {
      pendingDescription = undefined;
      continue;
    }

    const [rawKey, ...valueParts] = trimmed.split("=");
    const key = rawKey.trim();
    const value = valueParts.join("=").trim();
    const required = value === "" || value === "REQUIRED";

    entries.push({
      key,
      description: pendingDescription,
      required,
      defaultValue: required ? undefined : value,
    });

    pendingDescription = undefined;
  }

  return entries;
}

export function generateTemplate(envContent: string): string {
  const lines = envContent.split("\n");
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      output.push(line);
      continue;
    }
    if (trimmed.includes("=")) {
      const [key] = trimmed.split("=");
      output.push(`${key.trim()}=`);
    }
  }

  return output.join("\n");
}

export function loadTemplate(filePath: string): TemplateEntry[] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Template file not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, "utf-8");
  return parseTemplate(content);
}
