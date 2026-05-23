import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getBackupDir,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
} from './env-backup';

describe('env-backup', () => {
  let tmpDir: string;
  let originalHome: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-backup-test-'));
    originalHome = os.homedir();
    jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('getBackupDir returns path under homedir', () => {
    const dir = getBackupDir();
    expect(dir).toContain('.envsync');
    expect(dir).toContain('backups');
  });

  it('createBackup writes a backup file and returns its path', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value\n');
    const backupPath = createBackup(envFile);
    expect(fs.existsSync(backupPath)).toBe(true);
    const entry = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    expect(entry.content).toBe('KEY=value\n');
    expect(entry.filePath).toBe(envFile);
  });

  it('listBackups returns all backups when no filter', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'A=1\n');
    createBackup(envFile);
    createBackup(envFile);
    const backups = listBackups();
    expect(backups.length).toBeGreaterThanOrEqual(2);
  });

  it('listBackups filters by filePath', () => {
    const envFile = path.join(tmpDir, '.env');
    const otherFile = path.join(tmpDir, '.env.other');
    fs.writeFileSync(envFile, 'A=1\n');
    fs.writeFileSync(otherFile, 'B=2\n');
    createBackup(envFile);
    createBackup(otherFile);
    const backups = listBackups(envFile);
    expect(backups.every(b => b.filePath === envFile)).toBe(true);
  });

  it('restoreBackup restores content to original path', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'ORIGINAL=1\n');
    const backupPath = createBackup(envFile);
    fs.writeFileSync(envFile, 'MODIFIED=2\n');
    restoreBackup(backupPath);
    expect(fs.readFileSync(envFile, 'utf-8')).toBe('ORIGINAL=1\n');
  });

  it('deleteBackup removes the backup file', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'K=v\n');
    const backupPath = createBackup(envFile);
    deleteBackup(backupPath);
    expect(fs.existsSync(backupPath)).toBe(false);
  });
});
