import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface BackupEntry {
  timestamp: string;
  filePath: string;
  content: string;
}

export function getBackupDir(): string {
  return path.join(os.homedir(), '.envsync', 'backups');
}

export function ensureBackupDir(): void {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createBackup(filePath: string): string {
  ensureBackupDir();
  const content = fs.readFileSync(filePath, 'utf-8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(filePath);
  const backupFileName = `${baseName}.${timestamp}.bak`;
  const backupPath = path.join(getBackupDir(), backupFileName);
  const entry: BackupEntry = { timestamp: new Date().toISOString(), filePath, content };
  fs.writeFileSync(backupPath, JSON.stringify(entry, null, 2), 'utf-8');
  return backupPath;
}

export function listBackups(filePath?: string): BackupEntry[] {
  ensureBackupDir();
  const dir = getBackupDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.bak'));
  const entries: BackupEntry[] = files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
    return JSON.parse(raw) as BackupEntry;
  });
  if (filePath) {
    return entries.filter(e => e.filePath === filePath);
  }
  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function restoreBackup(backupPath: string, targetPath?: string): void {
  const raw = fs.readFileSync(backupPath, 'utf-8');
  const entry: BackupEntry = JSON.parse(raw);
  const dest = targetPath ?? entry.filePath;
  fs.writeFileSync(dest, entry.content, 'utf-8');
}

export function deleteBackup(backupPath: string): void {
  fs.unlinkSync(backupPath);
}
