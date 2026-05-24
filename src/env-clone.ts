import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile, formatEnvFile } from './store';

export interface CloneOptions {
  overwrite?: boolean;
  keys?: string[];
}

export interface CloneResult {
  copied: string[];
  skipped: string[];
  written: string;
}

export function cloneEnvFile(
  sourcePath: string,
  destPath: string,
  options: CloneOptions = {}
): CloneResult {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  if (fs.existsSync(destPath) && !options.overwrite) {
    throw new Error(
      `Destination file already exists: ${destPath}. Use --overwrite to replace.`
    );
  }

  const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
  const parsed = parseEnvFile(sourceContent);

  const copied: string[] = [];
  const skipped: string[] = [];
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (!options.keys || options.keys.includes(key)) {
      result[key] = value;
      copied.push(key);
    } else {
      skipped.push(key);
    }
  }

  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const output = formatEnvFile(result);
  fs.writeFileSync(destPath, output, 'utf-8');

  return { copied, skipped, written: destPath };
}

export function formatCloneResult(result: CloneResult): string {
  const lines: string[] = [];
  lines.push(`Cloned to: ${result.written}`);
  lines.push(`  Copied : ${result.copied.length} key(s)`);
  if (result.skipped.length > 0) {
    lines.push(`  Skipped: ${result.skipped.length} key(s)`);
  }
  return lines.join('\n');
}
