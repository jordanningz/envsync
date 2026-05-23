import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import { registerValidateCommands } from './validate-cmd';

vi.mock('fs');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerValidateCommands(program);
  return program;
}

const sampleEnv = 'DATABASE_URL=postgres://localhost\nAPI_KEY=abc\n';
const sampleRules = JSON.stringify([
  { key: 'DATABASE_URL', required: true },
  { key: 'API_KEY', required: true },
]);

describe('validate command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exits with code 1 if env file not found', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const program = buildProgram();
    expect(() => program.parse(['node', 'cli', 'validate'])).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('prints validation passed for valid env', () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith('.envsync-rules.json') || String(p).endsWith('.env')
    );
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (String(p).endsWith('.env')) return sampleEnv;
      return sampleRules;
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'cli', 'validate']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✔ Validation passed'));
  });

  it('exits 1 and prints failure for invalid env', () => {
    const incompleteEnv = 'DATABASE_URL=postgres://localhost\n';
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (String(p).endsWith('.env')) return incompleteEnv;
      return sampleRules;
    });
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    expect(() => program.parse(['node', 'cli', 'validate'])).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
