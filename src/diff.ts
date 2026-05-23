import { parseEnvFile } from './store';

export interface EnvDiff {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { old: string; new: string }>;
  unchanged: Record<string, string>;
}

export function diffEnvFiles(oldContent: string, newContent: string): EnvDiff {
  const oldVars = parseEnvFile(oldContent);
  const newVars = parseEnvFile(newContent);

  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { old: string; new: string }> = {};
  const unchanged: Record<string, string> = {};

  for (const [key, value] of Object.entries(newVars)) {
    if (!(key in oldVars)) {
      added[key] = value;
    } else if (oldVars[key] !== value) {
      changed[key] = { old: oldVars[key], new: value };
    } else {
      unchanged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(oldVars)) {
    if (!(key in newVars)) {
      removed[key] = value;
    }
  }

  return { added, removed, changed, unchanged };
}

export function formatDiff(diff: EnvDiff, maskValues = true): string {
  const mask = (v: string) => (maskValues ? '****' : v);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(diff.added)) {
    lines.push(`+ ${key}=${mask(value)}`);
  }
  for (const [key, value] of Object.entries(diff.removed)) {
    lines.push(`- ${key}=${mask(value)}`);
  }
  for (const [key, { old, new: newVal }] of Object.entries(diff.changed)) {
    lines.push(`~ ${key}: ${mask(old)} -> ${mask(newVal)}`);
  }

  if (lines.length === 0) {
    return 'No changes detected.';
  }

  return lines.join('\n');
}

export function hasDiff(diff: EnvDiff): boolean {
  return (
    Object.keys(diff.added).length > 0 ||
    Object.keys(diff.removed).length > 0 ||
    Object.keys(diff.changed).length > 0
  );
}
