import { parseEnvFile } from './store';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: { key: string; reason: string }[];
  warnings: string[];
}

export function validateEnvFile(
  content: string,
  rules: ValidationRule[]
): ValidationResult {
  const parsed = parseEnvFile(content);
  const keys = new Set(Object.keys(parsed));

  const missing: string[] = [];
  const invalid: { key: string; reason: string }[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    if (rule.required && !keys.has(rule.key)) {
      missing.push(rule.key);
      continue;
    }

    if (!keys.has(rule.key)) {
      warnings.push(`Optional key "${rule.key}" is not set`);
      continue;
    }

    const value = parsed[rule.key];

    if (rule.pattern && !rule.pattern.test(value)) {
      invalid.push({
        key: rule.key,
        reason: `Value does not match expected pattern`,
      });
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✔ Validation passed');
  } else {
    lines.push('✘ Validation failed');
  }

  for (const key of result.missing) {
    lines.push(`  [missing]  ${key}`);
  }

  for (const { key, reason } of result.invalid) {
    lines.push(`  [invalid] ${key}: ${reason}`);
  }

  for (const warn of result.warnings) {
    lines.push(`  [warning] ${warn}`);
  }

  return lines.join('\n');
}
