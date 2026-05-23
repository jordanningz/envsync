import { parseEnvFile, formatEnvFile } from './store';

export type MergeStrategy = 'ours' | 'theirs' | 'interactive';

export interface MergeConflict {
  key: string;
  ours: string | undefined;
  theirs: string | undefined;
}

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: MergeConflict[];
}

/**
 * Merge two env file contents using the given strategy.
 * 'ours'   — prefer local values on conflict
 * 'theirs' — prefer remote values on conflict
 * 'interactive' — collect conflicts for manual resolution
 */
export function mergeEnvFiles(
  ours: string,
  theirs: string,
  strategy: MergeStrategy = 'ours'
): MergeResult {
  const ourMap = parseEnvFile(ours);
  const theirMap = parseEnvFile(theirs);

  const allKeys = new Set([...Object.keys(ourMap), ...Object.keys(theirMap)]);
  const merged: Record<string, string> = {};
  const conflicts: MergeConflict[] = [];

  for (const key of allKeys) {
    const ourVal = ourMap[key];
    const theirVal = theirMap[key];

    if (ourVal === theirVal) {
      // identical or both undefined — just use whichever exists
      merged[key] = ourVal ?? theirVal ?? '';
    } else if (ourVal === undefined) {
      merged[key] = theirVal!;
    } else if (theirVal === undefined) {
      merged[key] = ourVal;
    } else {
      // genuine conflict
      if (strategy === 'ours') {
        merged[key] = ourVal;
      } else if (strategy === 'theirs') {
        merged[key] = theirVal;
      } else {
        // interactive: leave unresolved, record conflict
        conflicts.push({ key, ours: ourVal, theirs: theirVal });
      }
    }
  }

  return { merged, conflicts };
}

/**
 * Apply resolved conflict values into the merged map and return the final env content.
 */
export function applyResolutions(
  merged: Record<string, string>,
  resolutions: Record<string, string>
): string {
  const final = { ...merged, ...resolutions };
  return formatEnvFile(final);
}
