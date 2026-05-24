import { describe, it, expect } from 'vitest';
import { searchEnvFile, formatSearchResults } from './env-search';

const sampleEnv = `DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
API_KEY=secret123
API_URL=https://api.example.com
DEBUG=true
`;

describe('searchEnvFile', () => {
  it('finds results by key (case-insensitive by default)', () => {
    const results = searchEnvFile(sampleEnv, 'db');
    expect(results.map(r => r.key)).toEqual(['DB_HOST', 'DB_PORT', 'DB_NAME']);
  });

  it('finds results by value', () => {
    const results = searchEnvFile(sampleEnv, 'localhost');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DB_HOST');
  });

  it('respects caseSensitive option', () => {
    const results = searchEnvFile(sampleEnv, 'db', { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('restricts to keys only', () => {
    const results = searchEnvFile(sampleEnv, 'api', { keysOnly: true });
    expect(results.map(r => r.key)).toEqual(['API_KEY', 'API_URL']);
  });

  it('restricts to values only', () => {
    const results = searchEnvFile(sampleEnv, 'true', { valuesOnly: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DEBUG');
  });

  it('supports regex search', () => {
    const results = searchEnvFile(sampleEnv, 'DB_(HOST|PORT)', { regex: true });
    expect(results.map(r => r.key)).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('throws on invalid regex', () => {
    expect(() => searchEnvFile(sampleEnv, '[invalid', { regex: true })).toThrow('Invalid regex pattern');
  });

  it('returns correct line numbers', () => {
    const results = searchEnvFile(sampleEnv, 'DB_PORT');
    expect(results[0].lineNumber).toBe(2);
  });

  it('returns empty array when no match', () => {
    const results = searchEnvFile(sampleEnv, 'NONEXISTENT');
    expect(results).toHaveLength(0);
  });
});

describe('formatSearchResults', () => {
  it('formats results correctly', () => {
    const results = [{ key: 'DB_HOST', value: 'localhost', lineNumber: 1 }];
    const output = formatSearchResults(results, 'db');
    expect(output).toContain('1 result(s)');
    expect(output).toContain('DB_HOST=localhost');
  });

  it('shows no results message', () => {
    const output = formatSearchResults([], 'missing');
    expect(output).toContain('No results found');
  });
});
