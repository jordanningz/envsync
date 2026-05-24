# env-check

The `env-check` module compares a `.env` file against a `.env.example` template to identify missing or undocumented keys.

## Usage

```bash
# Basic check (uses .env and .env.example by default)
npx envsync check

# Custom paths
npx envsync check --env .env.production --example .env.example

# Strict mode: also fail if .env has keys not in .env.example
npx envsync check --strict
```

## Output

- **Present**: keys found in both `.env` and `.env.example`
- **Missing**: keys in `.env.example` but absent from `.env`
- **Extra**: keys in `.env` not documented in `.env.example` (shown in strict mode)

## Exit Codes

| Code | Meaning |
|------|---------|
| `0`  | All required keys are present (and no extras in strict mode) |
| `1`  | Missing keys detected, or extra keys detected in strict mode |

## Programmatic API

```typescript
import { checkEnvAgainstExample, formatCheckResult } from './env-check';

const result = checkEnvAgainstExample(envContent, exampleContent);
console.log(formatCheckResult(result));
// result.missing  — string[]
// result.extra    — string[]
// result.present  — string[]
```
