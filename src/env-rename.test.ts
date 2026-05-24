import { describe, it, expect } from 'vitest';
import { renameEnvKey } from './env-rename';

const sample = 'FOO=bar\nBAZ=qux\nHELLO=world\n';

describe('renameEnvKey', () => {
  it('renames an existing key', () => {
    const { content, result } = renameEnvKey(sample, 'FOO', 'FOO_NEW');
    expect(result.success).toBe(true);
    expect(content).toContain('FOO_NEW=bar');
    expect(content).not.toContain('FOO=bar');
  });

  it('preserves other keys', () => {
    const { content } = renameEnvKey(sample, 'FOO', 'FOO_NEW');
    expect(content).toContain('BAZ=qux');
    expect(content).toContain('HELLO=world');
  });

  it('returns error when old key not found', () => {
    const { result, content } = renameEnvKey(sample, 'MISSING', 'NEW');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
    expect(content).toBe(sample);
  });

  it('returns error when new key already exists', () => {
    const { result } = renameEnvKey(sample, 'FOO', 'BAZ');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });

  it('returns error for invalid new key name', () => {
    const { result } = renameEnvKey(sample, 'FOO', '1INVALID');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid key name/);
  });

  it('returns error for empty key names', () => {
    const { result } = renameEnvKey(sample, '', 'NEW');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/empty/);
  });

  it('handles underscore-prefixed keys', () => {
    const { result } = renameEnvKey(sample, 'FOO', '_PRIVATE_FOO');
    expect(result.success).toBe(true);
  });
});
