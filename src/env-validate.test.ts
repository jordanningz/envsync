import { describe, it, expect } from 'vitest';
import {
  validateEnvFile,
  formatValidationResult,
  ValidationRule,
} from './env-validate';

const sampleEnv = `DATABASE_URL=postgres://localhost/mydb
API_KEY=abc123
PORT=3000
`;

const rules: ValidationRule[] = [
  { key: 'DATABASE_URL', required: true },
  { key: 'API_KEY', required: true, pattern: /^[a-z0-9]+$/ },
  { key: 'PORT', required: false, pattern: /^\d+$/ },
  { key: 'SECRET_KEY', required: true },
  { key: 'LOG_LEVEL', required: false },
];

describe('validateEnvFile', () => {
  it('detects missing required keys', () => {
    const result = validateEnvFile(sampleEnv, rules);
    expect(result.missing).toContain('SECRET_KEY');
  });

  it('reports valid: false when required keys are missing', () => {
    const result = validateEnvFile(sampleEnv, rules);
    expect(result.valid).toBe(false);
  });

  it('passes when all required keys are present and valid', () => {
    const fullEnv = sampleEnv + 'SECRET_KEY=mysecret\n';
    const result = validateEnvFile(fullEnv, rules);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });

  it('detects pattern mismatch', () => {
    const badEnv = 'DATABASE_URL=postgres://localhost\nAPI_KEY=INVALID_UPPER\nSECRET_KEY=x\n';
    const result = validateEnvFile(badEnv, rules);
    expect(result.invalid.map((e) => e.key)).toContain('API_KEY');
  });

  it('adds warnings for optional missing keys', () => {
    const fullEnv = sampleEnv + 'SECRET_KEY=mysecret\n';
    const result = validateEnvFile(fullEnv, rules);
    expect(result.warnings.some((w) => w.includes('LOG_LEVEL'))).toBe(true);
  });
});

describe('formatValidationResult', () => {
  it('shows passed message on success', () => {
    const result = { valid: true, missing: [], invalid: [], warnings: [] };
    expect(formatValidationResult(result)).toContain('✔ Validation passed');
  });

  it('shows failed message on failure', () => {
    const result = {
      valid: false,
      missing: ['SECRET_KEY'],
      invalid: [],
      warnings: [],
    };
    const output = formatValidationResult(result);
    expect(output).toContain('✘ Validation failed');
    expect(output).toContain('[missing]  SECRET_KEY');
  });
});
