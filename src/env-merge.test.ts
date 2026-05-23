import { mergeEnvFiles, applyResolutions } from './env-merge';

describe('mergeEnvFiles', () => {
  const base = 'FOO=bar\nSHARED=same\n';
  const remote = 'BAZ=qux\nSHARED=same\n';

  it('merges non-conflicting keys from both sides', () => {
    const { merged, conflicts } = mergeEnvFiles(base, remote, 'ours');
    expect(merged['FOO']).toBe('bar');
    expect(merged['BAZ']).toBe('qux');
    expect(conflicts).toHaveLength(0);
  });

  it('keeps identical values without conflict', () => {
    const { merged, conflicts } = mergeEnvFiles(base, remote, 'ours');
    expect(merged['SHARED']).toBe('same');
    expect(conflicts).toHaveLength(0);
  });

  it('prefers ours on conflict when strategy is ours', () => {
    const ours = 'KEY=local\n';
    const theirs = 'KEY=remote\n';
    const { merged, conflicts } = mergeEnvFiles(ours, theirs, 'ours');
    expect(merged['KEY']).toBe('local');
    expect(conflicts).toHaveLength(0);
  });

  it('prefers theirs on conflict when strategy is theirs', () => {
    const ours = 'KEY=local\n';
    const theirs = 'KEY=remote\n';
    const { merged, conflicts } = mergeEnvFiles(ours, theirs, 'theirs');
    expect(merged['KEY']).toBe('remote');
    expect(conflicts).toHaveLength(0);
  });

  it('records conflicts when strategy is interactive', () => {
    const ours = 'KEY=local\nFOO=bar\n';
    const theirs = 'KEY=remote\nFOO=bar\n';
    const { merged, conflicts } = mergeEnvFiles(ours, theirs, 'interactive');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({ key: 'KEY', ours: 'local', theirs: 'remote' });
    // conflicting key should NOT be in merged map
    expect(merged['KEY']).toBeUndefined();
    expect(merged['FOO']).toBe('bar');
  });

  it('includes key only present in ours', () => {
    const { merged } = mergeEnvFiles('ONLY_OURS=yes\n', '', 'ours');
    expect(merged['ONLY_OURS']).toBe('yes');
  });

  it('includes key only present in theirs', () => {
    const { merged } = mergeEnvFiles('', 'ONLY_THEIRS=yes\n', 'ours');
    expect(merged['ONLY_THEIRS']).toBe('yes');
  });
});

describe('applyResolutions', () => {
  it('merges resolutions into the merged map and returns env content', () => {
    const merged = { FOO: 'bar', BAZ: 'qux' };
    const resolutions = { CONFLICT_KEY: 'resolved' };
    const result = applyResolutions(merged, resolutions);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
    expect(result).toContain('CONFLICT_KEY=resolved');
  });

  it('allows resolutions to override existing merged values', () => {
    const merged = { KEY: 'old' };
    const result = applyResolutions(merged, { KEY: 'new' });
    expect(result).toContain('KEY=new');
    expect(result).not.toContain('KEY=old');
  });
});
