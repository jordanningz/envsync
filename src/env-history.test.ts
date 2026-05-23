import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listHistory, getSnapshot, formatHistory } from './env-history';
import * as git from './git';
import * as crypto from './crypto';
import * as store from './store';

vi.mock('./git');
vi.mock('./crypto');
vi.mock('./store');

const mockKey = Buffer.alloc(32, 1);

beforeEach(() => vi.clearAllMocks());

describe('listHistory', () => {
  it('returns sorted entries from notes', async () => {
    vi.mocked(git.gitNotesList).mockResolvedValue([
      { commit: 'abc1234', note: JSON.stringify({ timestamp: '2024-01-02', keys: ['A'] }) },
      { commit: 'def5678', note: JSON.stringify({ timestamp: '2024-01-01', keys: ['B'] }) },
    ]);
    const result = await listHistory('envsync');
    expect(result).toHaveLength(2);
    expect(result[0].commit).toBe('abc1234');
    expect(result[0].keys).toEqual(['A']);
  });

  it('skips malformed notes', async () => {
    vi.mocked(git.gitNotesList).mockResolvedValue([
      { commit: 'abc1234', note: 'not-json' },
      { commit: 'def5678', note: JSON.stringify({ timestamp: '2024-01-01', keys: [] }) },
    ]);
    const result = await listHistory('envsync');
    expect(result).toHaveLength(1);
  });
});

describe('getSnapshot', () => {
  it('decrypts and parses snapshot', async () => {
    const payload = JSON.stringify({ data: 'encrypted', timestamp: '2024-01-01' });
    vi.mocked(git.gitNotesShow).mockResolvedValue(payload);
    vi.mocked(crypto.decrypt).mockResolvedValue('FOO=bar\nBAZ=qux');
    vi.mocked(store.parseEnvFile).mockReturnValue({ FOO: 'bar', BAZ: 'qux' });
    const snap = await getSnapshot('abc1234', 'envsync', mockKey);
    expect(snap.commit).toBe('abc1234');
    expect(snap.env).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });
});

describe('formatHistory', () => {
  it('returns message when empty', () => {
    expect(formatHistory([])).toBe('No history found.');
  });

  it('formats entries', () => {
    const entries = [
      { commit: 'abc1234567', timestamp: '2024-01-01', keys: ['A', 'B'] },
    ];
    const output = formatHistory(entries);
    expect(output).toContain('abc1234');
    expect(output).toContain('A, B');
  });
});
