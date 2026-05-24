import { compareEnvFiles, formatCompareResult, hasCompareChanges } from './env-compare';

const envA = `FOO=bar
BAZ=qux
SHARED=same
`;

const envB = `FOO=changed
NEW=value
SHARED=same
`;

describe('compareEnvFiles', () => {
  it('detects keys only in A', () => {
    const result = compareEnvFiles(envA, envB);
    expect(result.onlyInA).toContain('BAZ');
  });

  it('detects keys only in B', () => {
    const result = compareEnvFiles(envA, envB);
    expect(result.onlyInB).toContain('NEW');
  });

  it('detects different values', () => {
    const result = compareEnvFiles(envA, envB);
    expect(result.different).toEqual(
      expect.arrayContaining([{ key: 'FOO', valueA: 'bar', valueB: 'changed' }])
    );
  });

  it('detects identical keys', () => {
    const result = compareEnvFiles(envA, envB);
    expect(result.identical).toContain('SHARED');
  });

  it('returns all identical when files are the same', () => {
    const result = compareEnvFiles(envA, envA);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.different).toHaveLength(0);
    expect(result.identical).toHaveLength(3);
  });
});

describe('formatCompareResult', () => {
  it('shows identical message when no changes', () => {
    const result = compareEnvFiles(envA, envA);
    expect(formatCompareResult(result)).toContain('identical');
  });

  it('includes custom labels', () => {
    const result = compareEnvFiles(envA, envB);
    const output = formatCompareResult(result, 'local', 'remote');
    expect(output).toContain('local');
    expect(output).toContain('remote');
  });

  it('shows different values with both sides', () => {
    const result = compareEnvFiles(envA, envB);
    const output = formatCompareResult(result);
    expect(output).toContain('bar');
    expect(output).toContain('changed');
  });
});

describe('hasCompareChanges', () => {
  it('returns true when there are differences', () => {
    const result = compareEnvFiles(envA, envB);
    expect(hasCompareChanges(result)).toBe(true);
  });

  it('returns false when files are identical', () => {
    const result = compareEnvFiles(envA, envA);
    expect(hasCompareChanges(result)).toBe(false);
  });
});
