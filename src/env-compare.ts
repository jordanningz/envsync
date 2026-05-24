import { parseEnvFile } from './store';
import * as fs from 'fs';

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  different: Array<{ key: string; valueA: string; valueB: string }>;
  identical: string[];
}

export function compareEnvFiles(
  contentA: string,
  contentB: string
): CompareResult {
  const mapA = parseEnvFile(contentA);
  const mapB = parseEnvFile(contentB);

  const keysA = new Set(Object.keys(mapA));
  const keysB = new Set(Object.keys(mapB));
  const allKeys = new Set([...keysA, ...keysB]);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const different: Array<{ key: string; valueA: string; valueB: string }> = [];
  const identical: string[] = [];

  for (const key of allKeys) {
    const inA = keysA.has(key);
    const inB = keysB.has(key);
    if (inA && !inB) {
      onlyInA.push(key);
    } else if (!inA && inB) {
      onlyInB.push(key);
    } else if (mapA[key] !== mapB[key]) {
      different.push({ key, valueA: mapA[key], valueB: mapB[key] });
    } else {
      identical.push(key);
    }
  }

  return { onlyInA, onlyInB, different, identical };
}

export function formatCompareResult(
  result: CompareResult,
  labelA = 'A',
  labelB = 'B'
): string {
  const lines: string[] = [];

  if (result.onlyInA.length > 0) {
    lines.push(`Only in ${labelA}:`);
    result.onlyInA.forEach(k => lines.push(`  - ${k}`));
  }
  if (result.onlyInB.length > 0) {
    lines.push(`Only in ${labelB}:`);
    result.onlyInB.forEach(k => lines.push(`  + ${k}`));
  }
  if (result.different.length > 0) {
    lines.push('Different values:');
    result.different.forEach(({ key, valueA, valueB }) => {
      lines.push(`  ~ ${key}`);
      lines.push(`      ${labelA}: ${valueA}`);
      lines.push(`      ${labelB}: ${valueB}`);
    });
  }
  if (lines.length === 0) {
    lines.push('Files are identical.');
  } else {
    lines.push(`\n${result.identical.length} key(s) identical.`);
  }

  return lines.join('\n');
}

export function hasCompareChanges(result: CompareResult): boolean {
  return (
    result.onlyInA.length > 0 ||
    result.onlyInB.length > 0 ||
    result.different.length > 0
  );
}
