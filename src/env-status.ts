import { gitNotesList, gitNotesShow } from './git';
import { parseEnvFile } from './store';
import { loadConfig } from './config';
import * as fs from 'fs';

export interface EnvStatus {
  key: string;
  localExists: boolean;
  remoteExists: boolean;
  inSync: boolean;
  localValue?: string;
  remoteValue?: string;
}

export interface StatusReport {
  entries: EnvStatus[];
  totalLocal: number;
  totalRemote: number;
  missingLocally: number;
  missingRemotely: number;
  outOfSync: number;
}

export async function getEnvStatus(
  localPath: string,
  commitRef: string = 'HEAD'
): Promise<StatusReport> {
  const config = await loadConfig();
  const namespace = config.notesRef ?? 'refs/notes/envsync';

  let remoteVars: Record<string, string> = {};
  try {
    const raw = await gitNotesShow(commitRef, namespace);
    remoteVars = parseEnvFile(raw);
  } catch {
    // no remote note yet
  }

  let localVars: Record<string, string> = {};
  if (fs.existsSync(localPath)) {
    const raw = fs.readFileSync(localPath, 'utf8');
    localVars = parseEnvFile(raw);
  }

  const allKeys = new Set([...Object.keys(localVars), ...Object.keys(remoteVars)]);
  const entries: EnvStatus[] = [];

  for (const key of allKeys) {
    const localExists = key in localVars;
    const remoteExists = key in remoteVars;
    const inSync = localExists && remoteExists && localVars[key] === remoteVars[key];
    entries.push({
      key,
      localExists,
      remoteExists,
      inSync,
      localValue: localVars[key],
      remoteValue: remoteVars[key],
    });
  }

  return {
    entries,
    totalLocal: Object.keys(localVars).length,
    totalRemote: Object.keys(remoteVars).length,
    missingLocally: entries.filter(e => !e.localExists).length,
    missingRemotely: entries.filter(e => !e.remoteExists).length,
    outOfSync: entries.filter(e => e.localExists && e.remoteExists && !e.inSync).length,
  };
}

export function formatStatusReport(report: StatusReport): string {
  const lines: string[] = [];
  lines.push(`Local vars: ${report.totalLocal}  Remote vars: ${report.totalRemote}`);
  lines.push(
    `Missing locally: ${report.missingLocally}  Missing remotely: ${report.missingRemotely}  Out of sync: ${report.outOfSync}`
  );
  lines.push('');
  for (const e of report.entries) {
    let symbol = '✓';
    if (!e.localExists) symbol = '↓';
    else if (!e.remoteExists) symbol = '↑';
    else if (!e.inSync) symbol = '≠';
    lines.push(`  ${symbol} ${e.key}`);
  }
  return lines.join('\n');
}
