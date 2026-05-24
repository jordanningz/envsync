import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import { registerSearchCommands } from './search-cmd';

vi.mock('fs');

const sampleEnv = 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret\n';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSearchCommands(program);
  return program;
}

describe('search command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(sampleEnv);
  });

  it('searches and prints results', () => {
    buildProgram().parse(['search', 'db'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DB_HOST'));
  });

  it('shows no results message when nothing matches', () => {
    buildProgram().parse(['search', 'NOTFOUND'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No results found'));
  });

  it('exits with error when file not found', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => buildProgram().parse(['search', 'db'], { from: 'user' })).toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    exitSpy.mockRestore();
  });

  it('exits with error on invalid regex', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['search', '[bad', '--regex'], { from: 'user' })
    ).toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Search error'));
    exitSpy.mockRestore();
  });

  it('passes keys-only flag', () => {
    buildProgram().parse(['search', 'db', '--keys-only'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('result'));
  });
});
