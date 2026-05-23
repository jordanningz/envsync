import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerHistoryCommands } from './history-cmd';
import * as envHistory from './env-history';
import * as config from './config';
import * as keystore from './keystore';
import * as store from './store';

vi.mock('./env-history');
vi.mock('./config');
vi.mock('./keystore');
vi.mock('./store');

export function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommands(program);
  return program;
}

beforeEach(() => vi.clearAllMocks());

describe('history list', () => {
  it('prints formatted history', async () => {
    vi.mocked(envHistory.listHistory).mockResolvedValue([
      { commit: 'abc1234567', timestamp: '2024-01-01', keys: ['FOO'] },
    ]);
    vi.mocked(envHistory.formatHistory).mockReturnValue('abc1234  2024-01-01  keys: FOO');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['history', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('abc1234'));
  });

  it('handles errors gracefully', async () => {
    vi.mocked(envHistory.listHistory).mockRejectedValue(new Error('git error'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['history', 'list'], { from: 'user' })).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(String));
  });
});

describe('history show', () => {
  it('shows snapshot details', async () => {
    vi.mocked(config.loadConfig).mockResolvedValue({ namespace: 'envsync' } as any);
    vi.mocked(keystore.generateKey).mockResolvedValue(Buffer.alloc(32) as any);
    vi.mocked(envHistory.getSnapshot).mockResolvedValue({
      commit: 'abc1234',
      timestamp: '2024-01-01',
      env: { FOO: 'bar' },
    });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['history', 'show', 'abc1234'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('abc1234'));
    expect(spy).toHaveBeenCalledWith('FOO=bar');
  });
});
