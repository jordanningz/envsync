import { Command } from 'commander';
import { registerCompareCommands } from './compare-cmd';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompareCommands(program);
  return program;
}

function writeTmp(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('compare command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-compare-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('prints identical message for same files', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const a = writeTmp(tmpDir, '.env.a', content);
    const b = writeTmp(tmpDir, '.env.b', content);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['compare', a, b], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('identical'));
    spy.mockRestore();
  });

  it('shows differences between files', () => {
    const a = writeTmp(tmpDir, '.env.a', 'FOO=bar\n');
    const b = writeTmp(tmpDir, '.env.b', 'FOO=changed\nNEW=val\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['compare', a, b], { from: 'user' });
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('FOO');
    expect(output).toContain('NEW');
    spy.mockRestore();
  });

  it('uses custom labels when provided', () => {
    const a = writeTmp(tmpDir, '.env.a', 'FOO=bar\n');
    const b = writeTmp(tmpDir, '.env.b', 'FOO=baz\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['compare', a, b, '--label-a', 'local', '--label-b', 'remote'], { from: 'user' });
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('local');
    expect(output).toContain('remote');
    spy.mockRestore();
  });

  it('exits with error when file not found', () => {
    const a = writeTmp(tmpDir, '.env.a', 'FOO=bar\n');
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
    expect(() =>
      buildProgram().parse(['compare', a, '/nonexistent/.env'], { from: 'user' })
    ).toThrow('exit');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
