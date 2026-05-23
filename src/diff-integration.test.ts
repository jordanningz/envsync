import { describe, it, expect } from 'vitest';
import { diffEnvFiles, formatDiff, hasDiff } from './diff';

describe('diff integration', () => {
  it('full round-trip: parse, diff, format', () => {
    const v1 = [
      'APP_NAME=myapp',
      'DB_URL=postgres://localhost/dev',
      'SECRET=abc123',
    ].join('\n');

    const v2 = [
      'APP_NAME=myapp',
      'DB_URL=postgres://prod-host/prod',
      'API_TOKEN=xyz789',
    ].join('\n');

    const diff = diffEnvFiles(v1, v2);

    expect(hasDiff(diff)).toBe(true);
    expect(diff.unchanged).toHaveProperty('APP_NAME');
    expect(diff.changed).toHaveProperty('DB_URL');
    expect(diff.added).toHaveProperty('API_TOKEN');
    expect(diff.removed).toHaveProperty('SECRET');

    const masked = formatDiff(diff, true);
    expect(masked).toContain('+ API_TOKEN=****');
    expect(masked).toContain('- SECRET=****');
    expect(masked).toContain('~ DB_URL');
    expect(masked).not.toContain('xyz789');
    expect(masked).not.toContain('abc123');

    const revealed = formatDiff(diff, false);
    expect(revealed).toContain('xyz789');
    expect(revealed).toContain('abc123');
    expect(revealed).toContain('postgres://prod-host/prod');
  });

  it('handles empty old file', () => {
    const diff = diffEnvFiles('', 'FOO=bar\nBAZ=qux');
    expect(Object.keys(diff.added)).toHaveLength(2);
    expect(Object.keys(diff.removed)).toHaveLength(0);
    expect(hasDiff(diff)).toBe(true);
  });

  it('handles empty new file', () => {
    const diff = diffEnvFiles('FOO=bar\nBAZ=qux', '');
    expect(Object.keys(diff.removed)).toHaveLength(2);
    expect(Object.keys(diff.added)).toHaveLength(0);
  });

  it('handles both empty files', () => {
    const diff = diffEnvFiles('', '');
    expect(hasDiff(diff)).toBe(false);
    expect(formatDiff(diff)).toBe('No changes detected.');
  });
});
