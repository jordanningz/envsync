import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerLintCommands } from './lint-cmd';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLintCommands(program);
  return program;
}

function writeTmp(content: string): string {
  const file = path.join(os.tmpdir(), `envsync-lint-${Date.now()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe('lint command', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('reports no issues for a clean file', async () => {
    const file = writeTmp('API_KEY=abc123\nDB_HOST=localhost\n');
    const program = buildProgram();
    await program.parseAsync(['lint', file], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No lint issues found')
    );
    fs.unlinkSync(file);
  });

  it('reports issues for a bad file', async () => {
    const file = writeTmp('api_key=\n');
    const program = buildProgram();
    await program.parseAsync(['lint', file], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('lint issue')
    );
    fs.unlinkSync(file);
  });

  it('filters rules when --rules is provided', async () => {
    const file = writeTmp('api_key=value\n');
    const program = buildProgram();
    await program.parseAsync(
      ['lint', file, '--rules', 'uppercase-keys'],
      { from: 'user' }
    );
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('uppercase-keys');
    fs.unlinkSync(file);
  });

  it('exits with error when file does not exist', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    await expect(
      program.parseAsync(['lint', '/nonexistent/.env'], { from: 'user' })
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
