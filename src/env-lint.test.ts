import { lintEnvFile, formatLintResults, DEFAULT_RULES } from './env-lint';

describe('lintEnvFile', () => {
  it('returns no issues for a clean file', () => {
    const content = 'API_KEY=abc123\nDB_HOST=localhost\n';
    const results = lintEnvFile(content);
    expect(results).toHaveLength(0);
  });

  it('detects empty values', () => {
    const content = 'API_KEY=\n';
    const results = lintEnvFile(content);
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('detects lowercase keys', () => {
    const content = 'api_key=secret\n';
    const results = lintEnvFile(content);
    expect(results.some((r) => r.rule === 'uppercase-keys')).toBe(true);
  });

  it('detects quoted values', () => {
    const content = 'API_KEY="mysecret"\n';
    const results = lintEnvFile(content);
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('detects trailing whitespace in values', () => {
    const content = 'API_KEY=value   \n';
    const results = lintEnvFile(content);
    expect(results.some((r) => r.rule === 'no-trailing-whitespace')).toBe(true);
  });

  it('can run with custom rules only', () => {
    const content = 'api_key=\n';
    const results = lintEnvFile(content, [
      DEFAULT_RULES.find((r) => r.name === 'no-empty-value')!,
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-empty-value');
  });

  it('returns multiple issues for the same key', () => {
    const content = 'api_key=   \n';
    const results = lintEnvFile(content);
    const rules = results.map((r) => r.rule);
    expect(rules).toContain('uppercase-keys');
    expect(rules).toContain('no-trailing-whitespace');
  });
});

describe('formatLintResults', () => {
  it('returns clean message when no issues', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('includes rule name and message in output', () => {
    const results = lintEnvFile('api_key=\n');
    const output = formatLintResults(results);
    expect(output).toContain('lint issue');
    expect(output).toContain('uppercase-keys');
  });
});
