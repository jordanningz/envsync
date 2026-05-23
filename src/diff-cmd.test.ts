import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerDiffCommands } from './diff-cmd';

vi.mock('./diff', () => ({
  diffEnvFiles: vi.fn(() => ({
    added: { NEW_KEY: 'val' },
    removed: {},
    changed: {},
    unchanged: { EXISTING: 'x' },
  })),
  formatDiff: vi.fn(() => '+ NEW_KEY=****'),
  hasDiff: vi.fn(() => true),
}));

vi.mock('./crypto', () => ({ decrypt: vi.fn(async () => 'DB=old') }));
vi.mock('./git', () => ({ gitNotesShow: vi.fn(async () => 'encrypted') }));
vi.mock('./config', () => ({ loadConfig: vi.fn(async () => ({ keyId: 'key1' })) }));
vi.mock('./keystore', () => ({
  generateKey: vi.fn(() => Buffer.alloc(32)),
  keyExists: vi.fn(() => true),
}));
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => 'DB=new\nNEW_KEY=val'),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerDiffCommands(program);
  return program;
}

describe('diff command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers the diff command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'diff');
    expect(cmd).toBeDefined();
  });

  it('runs diff and prints output', async () => {
    const { formatDiff } = await import('./diff');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff']);
    expect(formatDiff).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Diff for'));
    consoleSpy.mockRestore();
  });

  it('exits when no key found', async () => {
    const { keyExists } = await import('./keystore');
    vi.mocked(keyExists).mockReturnValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'diff'])).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });

  it('reports in-sync when no diff', async () => {
    const { hasDiff } = await import('./diff');
    vi.mocked(hasDiff).mockReturnValueOnce(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('in sync'));
    consoleSpy.mockRestore();
  });
});
