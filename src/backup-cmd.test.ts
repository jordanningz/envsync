import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerBackupCommands } from './backup-cmd';
import * as envBackup from './env-backup';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerBackupCommands(program);
  return program;
}

describe('backup-cmd', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-backup-cmd-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('backup create logs the backup path', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'X=1\n');
    const program = buildProgram();
    program.parse(['backup', 'create', envFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backup created:'));
  });

  it('backup list shows no backups message when empty', () => {
    jest.spyOn(envBackup, 'listBackups').mockReturnValue([]);
    const program = buildProgram();
    program.parse(['backup', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No backups found.');
  });

  it('backup list prints entries', () => {
    jest.spyOn(envBackup, 'listBackups').mockReturnValue([
      { timestamp: '2024-01-01T00:00:00.000Z', filePath: '/project/.env', content: 'A=1' },
    ]);
    const program = buildProgram();
    program.parse(['backup', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/project/.env'));
  });

  it('backup restore logs success', () => {
    jest.spyOn(envBackup, 'restoreBackup').mockImplementation(() => {});
    jest.spyOn(envBackup, 'getBackupDir').mockReturnValue(tmpDir);
    const program = buildProgram();
    program.parse(['backup', 'restore', '.env.2024-01-01.bak'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Restored'));
  });

  it('backup delete logs success', () => {
    jest.spyOn(envBackup, 'deleteBackup').mockImplementation(() => {});
    jest.spyOn(envBackup, 'getBackupDir').mockReturnValue(tmpDir);
    const program = buildProgram();
    program.parse(['backup', 'delete', '.env.2024-01-01.bak'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted backup'));
  });
});
