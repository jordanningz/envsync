import * as fs from "fs";
import { parseEnvFile, formatEnvFile } from "./store";

export type SortOrder = "asc" | "desc";

export interface SortOptions {
  order?: SortOrder;
  groupComments?: boolean;
}

export interface SortResult {
  original: string;
  sorted: string;
  changed: boolean;
  keyCount: number;
}

export function sortEnvFile(
  content: string,
  options: SortOptions = {}
): SortResult {
  const { order = "asc", groupComments = true } = options;
  const lines = content.split("\n");
  const entries: Array<{ key: string; value: string; comment: string }> = [];
  let pendingComment = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("#")) {
      if (groupComments) {
        pendingComment += (pendingComment ? "\n" : "") + line;
      }
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    entries.push({ key, value, comment: pendingComment });
    pendingComment = "";
  }

  const sorted = [...entries].sort((a, b) => {
    const cmp = a.key.localeCompare(b.key);
    return order === "asc" ? cmp : -cmp;
  });

  const outputLines: string[] = [];
  for (const entry of sorted) {
    if (entry.comment) {
      outputLines.push(entry.comment);
    }
    outputLines.push(`${entry.key}=${entry.value}`);
  }

  const sortedContent = outputLines.join("\n") + (outputLines.length ? "\n" : "");

  return {
    original: content,
    sorted: sortedContent,
    changed: content.trim() !== sortedContent.trim(),
    keyCount: sorted.length,
  };
}

export function sortEnvFileInPlace(
  filePath: string,
  options: SortOptions = {}
): SortResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const result = sortEnvFile(content, options);
  if (result.changed) {
    fs.writeFileSync(filePath, result.sorted, "utf-8");
  }
  return result;
}
