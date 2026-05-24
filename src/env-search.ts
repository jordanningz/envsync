import { parseEnvFile } from './store';

export interface SearchResult {
  key: string;
  value: string;
  lineNumber: number;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  keysOnly?: boolean;
  valuesOnly?: boolean;
  regex?: boolean;
}

export function searchEnvFile(
  content: string,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { caseSensitive = false, keysOnly = false, valuesOnly = false, regex = false } = options;

  const lines = content.split('\n');
  const results: SearchResult[] = [];

  let pattern: RegExp;
  try {
    const flags = caseSensitive ? '' : 'i';
    pattern = regex ? new RegExp(query, flags) : new RegExp(escapeRegex(query), flags);
  } catch {
    throw new Error(`Invalid regex pattern: ${query}`);
  }

  const parsed = parseEnvFile(content);
  const entries = Object.entries(parsed);

  entries.forEach(([key, value]) => {
    const lineNumber = findLineNumber(lines, key);
    const matchKey = !valuesOnly && pattern.test(key);
    const matchValue = !keysOnly && pattern.test(value);

    if (matchKey || matchValue) {
      results.push({ key, value, lineNumber });
    }
  });

  return results;
}

export function formatSearchResults(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return `No results found for "${query}".`;
  }

  const lines = [`Found ${results.length} result(s) for "${query}":`, ''];
  for (const r of results) {
    lines.push(`  Line ${r.lineNumber}: ${r.key}=${r.value}`);
  }
  return lines.join('\n');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findLineNumber(lines: string[], key: string): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith(`${key}=`)) {
      return i + 1;
    }
  }
  return -1;
}
