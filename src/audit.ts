import * as fs from 'fs';
import * as path from 'path';
import { getKeyFilePath } from './config';

export interface AuditEntry {
  timestamp: string;
  action: 'push' | 'pull' | 'invite' | 'key-generated' | 'key-rotated';
  user: string;
  details?: string;
}

function getAuditLogPath(): string {
  const keyDir = path.dirname(getKeyFilePath());
  return path.join(keyDir, 'audit.log');
}

export function appendAuditEntry(entry: Omit<AuditEntry, 'timestamp'>): void {
  const fullEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const line = JSON.stringify(fullEntry) + '\n';
  const logPath = getAuditLogPath();
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line, 'utf-8');
}

export function readAuditLog(): AuditEntry[] {
  const logPath = getAuditLogPath();
  if (!fs.existsSync(logPath)) return [];
  const raw = fs.readFileSync(logPath, 'utf-8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function formatAuditLog(entries: AuditEntry[]): string {
  if (entries.length === 0) return 'No audit entries found.';
  return entries
    .map(
      (e) =>
        `[${e.timestamp}] ${e.action.toUpperCase()} by ${e.user}${
          e.details ? ` — ${e.details}` : ''
        }`
    )
    .join('\n');
}
