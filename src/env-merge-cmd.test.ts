import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerMergeCommands } from './env-merge-cmd';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerMergeCommands(program);
  return program;
}

function writeTmp(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('merge command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-merge-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges non-conflicting env files to output file', async () => {
    const base = writeTmp(tmpDir, 'base.env', 'A=1\nB=2\n');
    const ours = writeTmp(tmpDir, 'ours.env', 'A=1\nB=3\n');
    const theirs = writeTmp(tmpDir, 'theirs.env', 'A=2\nB=2\n');
    const out = path.join(tmpDir, 'merged.env');

    const program = buildProgram();
    await program.parseAsync(['merge', base, ours, theirs, '--output', out], { from: 'user' });

    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('A=2');
    expect(content).toContain('B=3');
  });

  it('exits with error on conflicts in non-interactive mode', async () => {
    const base = writeTmp(tmpDir, 'base.env', 'A=1\n');
    const ours = writeTmp(tmpDir, 'ours.env', 'A=2\n');
    const theirs = writeTmp(tmpDir, 'theirs.env', 'A=3\n');

    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });

    await expect(
      program.parseAsync(['merge', base, ours, theirs, '--no-interactive'], { from: 'user' })
    ).rejects.toThrow('exit:1');

    mockExit.mockRestore();
  });

  it('registers merge command on program', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'merge');
    expect(cmd).toBeDefined();
  });
});
