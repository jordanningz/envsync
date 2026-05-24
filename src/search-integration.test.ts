import { describe, it, expect } from 'vitest';
import { searchEnvFile, formatSearchResults } from './env-search';

const envContent = [
  'DATABASE_URL=postgres://user:pass@localhost:5432/db',
  'REDIS_URL=redis://localhost:6379',
  'SECRET_KEY=supersecret',
  'DEBUG=false',
  'PORT=3000',
  'ALLOWED_HOSTS=localhost,127.0.0.1',
].join('\n');

describe('search integration', () => {
  it('finds all URL-related keys by value pattern', () => {
    const results = searchEnvFile(envContent, '://', { valuesOnly: true });
    expect(results.map(r => r.key)).toContain('DATABASE_URL');
    expect(results.map(r => r.key)).toContain('REDIS_URL');
  });

  it('finds keys matching regex anchored to start', () => {
    const results = searchEnvFile(envContent, '^DATABASE', { regex: true, keysOnly: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DATABASE_URL');
  });

  it('full-text search hits both keys and values', () => {
    const results = searchEnvFile(envContent, 'localhost');
    const keys = results.map(r => r.key);
    expect(keys).toContain('REDIS_URL');
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('ALLOWED_HOSTS');
  });

  it('format output contains line numbers and key=value pairs', () => {
    const results = searchEnvFile(envContent, 'PORT');
    const output = formatSearchResults(results, 'PORT');
    expect(output).toMatch(/Line \d+:/);
    expect(output).toContain('PORT=3000');
  });

  it('case-insensitive value search works end-to-end', () => {
    const results = searchEnvFile(envContent, 'FALSE', { caseSensitive: false, valuesOnly: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DEBUG');
  });
});
