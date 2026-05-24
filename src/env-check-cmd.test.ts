import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerCheckCommands } from './env-check-cmd';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCheckCommands(program);
  return program;
}

function writeTmp(content: string, ext = '.env'): string {
  const file = path.join(os.tmpdir(), `envsync-check-${Date.now()}${ext}`);
  fs.writeFileSync(file, content);
  return file;
}

describe('check command', () => {
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits 0 when all keys present', async () => {
    const envFile = writeTmp('FOO=bar\nBAR=baz\n');
    const exampleFile = writeTmp('FOO=\nBAR=\n', '.example');
    const program = buildProgram();
    program.parse(['check', '--env', envFile, '--example', exampleFile], { from: 'user' });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits 1 when keys are missing', async () => {
    const envFile = writeTmp('FOO=bar\n');
    const exampleFile = writeTmp('FOO=\nBAR=\n', '.example');
    const program = buildProgram();
    expect(() =>
      program.parse(['check', '--env', envFile, '--example', exampleFile], { from: 'user' })
    ).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 in strict mode when extra keys exist', async () => {
    const envFile = writeTmp('FOO=bar\nEXTRA=val\n');
    const exampleFile = writeTmp('FOO=\n', '.example');
    const program = buildProgram();
    expect(() =>
      program.parse(['check', '--env', envFile, '--example', exampleFile, '--strict'], { from: 'user' })
    ).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 when env file not found', async () => {
    const program = buildProgram();
    expect(() =>
      program.parse(['check', '--env', '/nonexistent/.env', '--example', '/nonexistent/.env.example'], { from: 'user' })
    ).toThrow('exit');
    expect(errorSpy).toHaveBeenCalled();
  });
});
