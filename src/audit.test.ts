import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { appendAuditEntry, readAuditLog, formatAuditLog, AuditEntry } from './audit';

const tmpDir = path.join(os.tmpdir(), 'envsync-audit-test-' + Date.now());

jest.mock('./config', () => ({
  getKeyFilePath: () => path.join(tmpDir, 'key', 'envsync.key'),
}));

beforeEach(() => {
  fs.mkdirSync(path.join(tmpDir, 'key'), { recursive: true });
});

afterEach(() => {
  const logPath = path.join(tmpDir, 'key', 'audit.log');
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('appendAuditEntry / readAuditLog', () => {
  it('writes and reads a single entry', () => {
    appendAuditEntry({ action: 'push', user: 'alice', details: 'main branch' });
    const entries = readAuditLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('push');
    expect(entries[0].user).toBe('alice');
    expect(entries[0].details).toBe('main branch');
    expect(entries[0].timestamp).toBeTruthy();
  });

  it('appends multiple entries in order', () => {
    appendAuditEntry({ action: 'pull', user: 'bob' });
    appendAuditEntry({ action: 'invite', user: 'alice', details: 'charlie' });
    const entries = readAuditLog();
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('pull');
    expect(entries[1].action).toBe('invite');
  });

  it('returns empty array when no log exists', () => {
    const entries = readAuditLog();
    expect(entries).toEqual([]);
  });
});

describe('formatAuditLog', () => {
  it('returns placeholder when empty', () => {
    expect(formatAuditLog([])).toBe('No audit entries found.');
  });

  it('formats entries correctly', () => {
    const entries: AuditEntry[] = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'push', user: 'alice', details: 'env updated' },
    ];
    const output = formatAuditLog(entries);
    expect(output).toContain('PUSH');
    expect(output).toContain('alice');
    expect(output).toContain('env updated');
  });
});
