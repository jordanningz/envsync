import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { validateEnvFile, formatValidationResult, ValidationRule } from './env-validate';

function loadRules(rulesPath: string): ValidationRule[] {
  if (!fs.existsSync(rulesPath)) {
    return [];
  }
  const raw = fs.readFileSync(rulesPath, 'utf-8');
  return JSON.parse(raw) as ValidationRule[];
}

export function registerValidateCommands(program: Command): void {
  program
    .command('validate')
    .description('Validate a .env file against a set of rules')
    .option('-f, --file <path>', '.env file to validate', '.env')
    .option(
      '-r, --rules <path>',
      'JSON file with validation rules',
      '.envsync-rules.json'
    )
    .action((opts: { file: string; rules: string }) => {
      const envPath = path.resolve(opts.file);
      const rulesPath = path.resolve(opts.rules);

      if (!fs.existsSync(envPath)) {
        console.error(`Error: env file not found: ${envPath}`);
        process.exit(1);
      }

      const content = fs.readFileSync(envPath, 'utf-8');
      const rules = loadRules(rulesPath);

      if (rules.length === 0) {
        console.warn(`Warning: no rules loaded from ${rulesPath}`);
      }

      const result = validateEnvFile(content, rules);
      console.log(formatValidationResult(result));

      if (!result.valid) {
        process.exit(1);
      }
    });
}
