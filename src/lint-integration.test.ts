import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { lintEnvFile, formatLintResults, DEFAULT_RULES } from './env-lint';

function tmpEnv(content: string): string {
  const p = path.join(os.tmpdir(), `envsync-lint-int-${Date.now()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('lint integration', () => {
  it('lints a real .env file on disk end-to-end', () => {
    const file = tmpEnv(
      'DATABASE_URL=postgres://localhost/mydb\nSECRET_KEY=supersecret\nDEBUG=true\n'
    );
    const content = fs.readFileSync(file, 'utf-8');
    const results = lintEnvFile(content, DEFAULT_RULES);
    expect(results).toHaveLength(0);
    fs.unlinkSync(file);
  });

  it('catches multiple issues across keys in a real file', () => {
    const file = tmpEnv(
      'api_url=\nsecret="wrapped"\nGOOD_KEY=fine\n'
    );
    const content = fs.readFileSync(file, 'utf-8');
    const results = lintEnvFile(content, DEFAULT_RULES);
    const rules = results.map((r) => r.rule);
    expect(rules).toContain('uppercase-keys');
    expect(rules).toContain('no-empty-value');
    expect(rules).toContain('no-quotes-in-value');
    fs.unlinkSync(file);
  });

  it('format output is human-readable for a mixed file', () => {
    const file = tmpEnv('bad_key=\n');
    const content = fs.readFileSync(file, 'utf-8');
    const results = lintEnvFile(content, DEFAULT_RULES);
    const output = formatLintResults(results);
    expect(output).toMatch(/Found \d+ lint issue/);
    expect(output).toContain('bad_key');
    fs.unlinkSync(file);
  });

  it('returns clean message for empty file', () => {
    const file = tmpEnv('');
    const content = fs.readFileSync(file, 'utf-8');
    const results = lintEnvFile(content, DEFAULT_RULES);
    expect(formatLintResults(results)).toBe('No lint issues found.');
    fs.unlinkSync(file);
  });
});
