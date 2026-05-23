import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface LockEntry {
  file: string;
  lockedBy: string;
  lockedAt: string;
  hostname: string;
}

export interface LockFile {
  locks: LockEntry[];
}

export function getLockFilePath(repoRoot: string): string {
  return path.join(repoRoot, ".env.lock.json");
}

export function readLockFile(repoRoot: string): LockFile {
  const lockPath = getLockFilePath(repoRoot);
  if (!fs.existsSync(lockPath)) {
    return { locks: [] };
  }
  const raw = fs.readFileSync(lockPath, "utf-8");
  return JSON.parse(raw) as LockFile;
}

export function writeLockFile(repoRoot: string, lockFile: LockFile): void {
  const lockPath = getLockFilePath(repoRoot);
  fs.writeFileSync(lockPath, JSON.stringify(lockFile, null, 2), "utf-8");
}

export function acquireLock(repoRoot: string, file: string, user: string): boolean {
  const lockFile = readLockFile(repoRoot);
  const existing = lockFile.locks.find((l) => l.file === file);
  if (existing) {
    return false;
  }
  lockFile.locks.push({
    file,
    lockedBy: user,
    lockedAt: new Date().toISOString(),
    hostname: os.hostname(),
  });
  writeLockFile(repoRoot, lockFile);
  return true;
}

export function releaseLock(repoRoot: string, file: string, user: string): boolean {
  const lockFile = readLockFile(repoRoot);
  const index = lockFile.locks.findIndex((l) => l.file === file && l.lockedBy === user);
  if (index === -1) {
    return false;
  }
  lockFile.locks.splice(index, 1);
  writeLockFile(repoRoot, lockFile);
  return true;
}

export function getLock(repoRoot: string, file: string): LockEntry | undefined {
  const lockFile = readLockFile(repoRoot);
  return lockFile.locks.find((l) => l.file === file);
}

export function listLocks(repoRoot: string): LockEntry[] {
  return readLockFile(repoRoot).locks;
}
