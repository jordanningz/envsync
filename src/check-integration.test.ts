import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { checkEnvAgainstExample, parseKeys, formatCheckResult } from './env-check';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-check-int-'));
}

describe('check integration', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('detects missing keys from a real file pair', () => {
    const envContent = 'DATABASE_URL=postgres://localhost/dev\nSECRET_KEY=abc123\n';
    const exampleContent = 'DATABASE_URL=\nSECRET_KEY=\nREDIS_URL=\nAPI_KEY=\n';

    const result = checkEnvAgainstExample(envContent, exampleContent);

    expect(result.missing).toContain('REDIS_URL');
    expect(result.missing).toContain('API_KEY');
    expect(result.present).toContain('DATABASE_URL');
    expect(result.present).toContain('SECRET_KEY');
  });

  it('detects extra keys not in example', () => {
    const envContent = 'FOO=1\nBAR=2\nUNDOCUMENTED=3\n';
    const exampleContent = 'FOO=\nBAR=\n';

    const result = checkEnvAgainstExample(envContent, exampleContent);

    expect(result.extra).toContain('UNDOCUMENTED');
    expect(result.missing).toHaveLength(0);
  });

  it('parseKeys ignores comments and blank lines', () => {
    const content = '# comment\n\nFOO=bar\n  # another\nBAR=baz\n';
    const keys = parseKeys(content);
    expect(keys).toEqual(['FOO', 'BAR']);
  });

  it('formatCheckResult shows all-clear message when no issues', () => {
    const result = { present: ['FOO', 'BAR'], missing: [], extra: [] };
    const output = formatCheckResult(result);
    expect(output).toMatch(/all required keys/i);
  });

  it('formatCheckResult lists missing and extra keys', () => {
    const result = { present: ['FOO'], missing: ['BAR', 'BAZ'], extra: ['GHOST'] };
    const output = formatCheckResult(result);
    expect(output).toMatch(/BAR/);
    expect(output).toMatch(/BAZ/);
    expect(output).toMatch(/GHOST/);
  });
});
