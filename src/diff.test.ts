import { describe, it, expect } from 'vitest';
import { diffEnvFiles, formatDiff, hasDiff } from './diff';

const oldEnv = `DB_HOST=localhost
DB_PORT=5432
API_KEY=secret123
DEBUG=true`;

const newEnv = `DB_HOST=localhost
DB_PORT=5433
API_SECRET=newsecret
DEBUG=true`;

describe('diffEnvFiles', () => {
  it('detects added keys', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    expect(diff.added).toHaveProperty('API_SECRET', 'newsecret');
  });

  it('detects removed keys', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    expect(diff.removed).toHaveProperty('API_KEY', 'secret123');
  });

  it('detects changed keys', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    expect(diff.changed).toHaveProperty('DB_PORT');
    expect(diff.changed['DB_PORT']).toEqual({ old: '5432', new: '5433' });
  });

  it('detects unchanged keys', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    expect(diff.unchanged).toHaveProperty('DB_HOST', 'localhost');
    expect(diff.unchanged).toHaveProperty('DEBUG', 'true');
  });

  it('returns empty diff for identical content', () => {
    const diff = diffEnvFiles(oldEnv, oldEnv);
    expect(hasDiff(diff)).toBe(false);
  });
});

describe('formatDiff', () => {
  it('masks values by default', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    const output = formatDiff(diff);
    expect(output).not.toContain('secret123');
    expect(output).not.toContain('newsecret');
    expect(output).toContain('****');
  });

  it('shows values when maskValues is false', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    const output = formatDiff(diff, false);
    expect(output).toContain('newsecret');
    expect(output).toContain('secret123');
  });

  it('returns no changes message for empty diff', () => {
    const diff = diffEnvFiles(oldEnv, oldEnv);
    expect(formatDiff(diff)).toBe('No changes detected.');
  });
});

describe('hasDiff', () => {
  it('returns true when there are differences', () => {
    const diff = diffEnvFiles(oldEnv, newEnv);
    expect(hasDiff(diff)).toBe(true);
  });

  it('returns false when files are identical', () => {
    const diff = diffEnvFiles(oldEnv, oldEnv);
    expect(hasDiff(diff)).toBe(false);
  });
});
