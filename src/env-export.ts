import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './store';

export type ExportFormat = 'dotenv' | 'json' | 'shell';

export function exportEnv(
  content: string,
  format: ExportFormat
): string {
  const entries = parseEnvFile(content);

  switch (format) {
    case 'json':
      return JSON.stringify(Object.fromEntries(entries), null, 2);

    case 'shell':
      return entries
        .map(([k, v]) => `export ${k}=${shellQuote(v)}`)
        .join('\n');

    case 'dotenv':
    default:
      return entries
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
  }
}

export function shellQuote(value: string): string {
  if (/[\s"'\\$`!]/.test(value)) {
    return `'${value.replace(/'/g, "'\\''")}' `;
  }
  return value;
}

export function writeExport(
  outputPath: string,
  content: string,
  format: ExportFormat
): void {
  const exported = exportEnv(content, format);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, exported, 'utf-8');
}

export function getExportExtension(format: ExportFormat): string {
  switch (format) {
    case 'json': return '.json';
    case 'shell': return '.sh';
    default: return '.env';
  }
}
