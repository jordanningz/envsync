import { parseEnvFile } from './store';

export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

export const DEFAULT_RULES: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value` : null,
  },
  {
    name: 'no-spaces-in-key',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace` : null,
  },
  {
    name: 'uppercase-keys',
    check: (key) =>
      key !== key.toUpperCase()
        ? `Key "${key}" should be uppercase`
        : null,
  },
  {
    name: 'no-quotes-in-value',
    check: (key, value) =>
      /^["'].*["']$/.test(value)
        ? `Key "${key}" value should not be wrapped in quotes`
        : null,
  },
  {
    name: 'no-trailing-whitespace',
    check: (key, value) =>
      value !== value.trim()
        ? `Key "${key}" value has trailing whitespace`
        : null,
  },
];

export function lintEnvFile(
  content: string,
  rules: LintRule[] = DEFAULT_RULES
): LintResult[] {
  const entries = parseEnvFile(content);
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(entries)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        results.push({ key, rule: rule.name, message });
      }
    }
  }
  return results;
}

export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) return 'No lint issues found.';
  const lines = results.map(
    (r) => `  [${r.rule}] ${r.message}`
  );
  return `Found ${results.length} lint issue(s):\n${lines.join('\n')}`;
}
