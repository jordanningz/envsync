import { parseEnvFile, formatEnvFile } from './store';

export interface MergeConflict {
  key: string;
  base: string | undefined;
  ours: string | undefined;
  theirs: string | undefined;
}

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: MergeConflict[];
}

export function mergeEnvFiles(base: string, ours: string, theirs: string): MergeResult {
  const baseMap = parseEnvFile(base);
  const oursMap = parseEnvFile(ours);
  const theirsMap = parseEnvFile(theirs);

  const allKeys = new Set([...Object.keys(baseMap), ...Object.keys(oursMap), ...Object.keys(theirsMap)]);
  const merged: Record<string, string> = {};
  const conflicts: MergeConflict[] = [];

  for (const key of allKeys) {
    const b = baseMap[key];
    const o = oursMap[key];
    const t = theirsMap[key];

    const oursChanged = o !== b;
    const theirsChanged = t !== b;

    if (!oursChanged && !theirsChanged) {
      // No change on either side — keep base (or ours/theirs, all equal)
      if (b !== undefined) merged[key] = b;
    } else if (oursChanged && !theirsChanged) {
      // Only ours changed
      if (o !== undefined) merged[key] = o;
    } else if (!oursChanged && theirsChanged) {
      // Only theirs changed
      if (t !== undefined) merged[key] = t;
    } else if (o === t) {
      // Both changed to same value
      if (o !== undefined) merged[key] = o;
    } else {
      // True conflict
      conflicts.push({ key, base: b, ours: o, theirs: t });
    }
  }

  return { merged, conflicts };
}

export function applyResolutions(result: MergeResult, resolutions: Record<string, string>): string {
  const final: Record<string, string> = { ...result.merged };

  for (const conflict of result.conflicts) {
    const resolution = resolutions[conflict.key];
    if (resolution !== undefined && resolution !== '') {
      final[conflict.key] = resolution;
    }
  }

  return formatEnvFile(final);
}
