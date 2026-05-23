import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { mergeEnvFiles, applyResolutions } from './env-merge';
import { formatEnvFile, parseEnvFile } from './store';

describe('merge integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-merge-int-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips through parse and format after merge', () => {
    const base = 'DB_HOST=localhost\nDB_PORT=5432\nSECRET=abc\n';
    const ours = 'DB_HOST=localhost\nDB_PORT=5433\nSECRET=abc\n';
    const theirs = 'DB_HOST=db.prod\nDB_PORT=5432\nSECRET=abc\n';

    const result = mergeEnvFiles(base, ours, theirs);
    expect(result.conflicts).toHaveLength(0);

    const merged = applyResolutions(result, {});
    const parsed = parseEnvFile(merged);

    expect(parsed['DB_HOST']).toBe('db.prod');
    expect(parsed['DB_PORT']).toBe('5433');
    expect(parsed['SECRET']).toBe('abc');
  });

  it('preserves all keys when files have disjoint additions', () => {
    const base = 'A=1\n';
    const ours = 'A=1\nB=2\n';
    const theirs = 'A=1\nC=3\n';

    const result = mergeEnvFiles(base, ours, theirs);
    const merged = applyResolutions(result, {});
    const parsed = parseEnvFile(merged);

    expect(parsed['A']).toBe('1');
    expect(parsed['B']).toBe('2');
    expect(parsed['C']).toBe('3');
  });

  it('writes and reads merged result from disk', () => {
    const base = 'X=10\nY=20\n';
    const ours = 'X=10\nY=25\n';
    const theirs = 'X=15\nY=20\n';

    const result = mergeEnvFiles(base, ours, theirs);
    const merged = applyResolutions(result, {});

    const outPath = path.join(tmpDir, 'result.env');
    fs.writeFileSync(outPath, merged, 'utf8');

    const read = fs.readFileSync(outPath, 'utf8');
    const parsed = parseEnvFile(read);

    expect(parsed['X']).toBe('15');
    expect(parsed['Y']).toBe('25');
  });
});
