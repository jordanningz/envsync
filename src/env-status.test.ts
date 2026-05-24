import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEnvStatus, formatStatusReport } from './env-status';
import * as git from './git';
import * as config from './config';
import * as fs from 'fs';

vi.mock('./git');
vi.mock('./config');
vi.mock('fs');

const mockConfig = { notesRef: 'refs/notes/envsync' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(config.loadConfig).mockResolvedValue(mockConfig as any);
});

describe('getEnvStatus', () => {
  it('returns in-sync entries when local and remote match', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue('FOO=bar\nBAZ=qux\n');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\nBAZ=qux\n');

    const report = await getEnvStatus('.env');
    expect(report.outOfSync).toBe(0);
    expect(report.totalLocal).toBe(2);
    expect(report.totalRemote).toBe(2);
    expect(report.entries.every(e => e.inSync)).toBe(true);
  });

  it('detects missing local keys', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue('FOO=bar\nNEW=val\n');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\n');

    const report = await getEnvStatus('.env');
    expect(report.missingLocally).toBe(1);
  });

  it('detects missing remote keys', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue('FOO=bar\n');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\nLOCAL_ONLY=1\n');

    const report = await getEnvStatus('.env');
    expect(report.missingRemotely).toBe(1);
  });

  it('detects out-of-sync values', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue('FOO=old\n');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=new\n');

    const report = await getEnvStatus('.env');
    expect(report.outOfSync).toBe(1);
  });

  it('handles no remote note gracefully', async () => {
    vi.mocked(git.gitNotesShow).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\n');

    const report = await getEnvStatus('.env');
    expect(report.totalRemote).toBe(0);
    expect(report.missingRemotely).toBe(1);
  });

  it('handles missing local file', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue('FOO=bar\n');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const report = await getEnvStatus('.env');
    expect(report.totalLocal).toBe(0);
    expect(report.missingLocally).toBe(1);
  });
});

describe('formatStatusReport', () => {
  it('includes summary counts', () => {
    const report = {
      entries: [{ key: 'FOO', localExists: true, remoteExists: true, inSync: true }],
      totalLocal: 1,
      totalRemote: 1,
      missingLocally: 0,
      missingRemotely: 0,
      outOfSync: 0,
    };
    const output = formatStatusReport(report);
    expect(output).toContain('Local vars: 1');
    expect(output).toContain('✓ FOO');
  });

  it('shows correct symbols for diverged entries', () => {
    const report = {
      entries: [
        { key: 'A', localExists: false, remoteExists: true, inSync: false },
        { key: 'B', localExists: true, remoteExists: false, inSync: false },
        { key: 'C', localExists: true, remoteExists: true, inSync: false },
      ],
      totalLocal: 2, totalRemote: 2, missingLocally: 1, missingRemotely: 1, outOfSync: 1,
    };
    const output = formatStatusReport(report);
    expect(output).toContain('↓ A');
    expect(output).toContain('↑ B');
    expect(output).toContain('≠ C');
  });
});
