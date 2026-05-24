import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cloneEnvFile, formatCloneResult } from './env-clone';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-clone-'));
}

describe('cloneEnvFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('clones all keys from source to destination', () => {
    const src = path.join(dir, '.env');
    const dest = path.join(dir, '.env.copy');
    fs.writeFileSync(src, 'FOO=bar\nBAZ=qux\n');

    const result = cloneEnvFile(src, dest);

    expect(result.copied).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(result.skipped).toHaveLength(0);
    expect(fs.existsSync(dest)).toBe(true);
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('FOO=bar');
    expect(content).toContain('BAZ=qux');
  });

  it('clones only selected keys when keys option is provided', () => {
    const src = path.join(dir, '.env');
    const dest = path.join(dir, '.env.partial');
    fs.writeFileSync(src, 'FOO=bar\nBAZ=qux\nSECRET=hidden\n');

    const result = cloneEnvFile(src, dest, { keys: ['FOO', 'BAZ'] });

    expect(result.copied).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(result.skipped).toContain('SECRET');
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).not.toContain('SECRET');
  });

  it('throws if source does not exist', () => {
    expect(() =>
      cloneEnvFile(path.join(dir, 'missing.env'), path.join(dir, 'out.env'))
    ).toThrow('Source file not found');
  });

  it('throws if destination exists and overwrite is false', () => {
    const src = path.join(dir, '.env');
    const dest = path.join(dir, '.env.copy');
    fs.writeFileSync(src, 'A=1\n');
    fs.writeFileSync(dest, 'B=2\n');

    expect(() => cloneEnvFile(src, dest)).toThrow('already exists');
  });

  it('overwrites destination when overwrite option is true', () => {
    const src = path.join(dir, '.env');
    const dest = path.join(dir, '.env.copy');
    fs.writeFileSync(src, 'A=1\n');
    fs.writeFileSync(dest, 'OLD=value\n');

    const result = cloneEnvFile(src, dest, { overwrite: true });
    expect(result.copied).toContain('A');
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).not.toContain('OLD');
  });
});

describe('formatCloneResult', () => {
  it('formats result with skipped keys', () => {
    const output = formatCloneResult({
      copied: ['A', 'B'],
      skipped: ['C'],
      written: '/tmp/.env.copy',
    });
    expect(output).toContain('Cloned to: /tmp/.env.copy');
    expect(output).toContain('2 key(s)');
    expect(output).toContain('Skipped: 1');
  });

  it('omits skipped line when nothing was skipped', () => {
    const output = formatCloneResult({
      copied: ['A'],
      skipped: [],
      written: '/tmp/.env.copy',
    });
    expect(output).not.toContain('Skipped');
  });
});
