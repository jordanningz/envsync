import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { checkEnvAgainstExample, formatCheckResult } from './env-check';

export function registerCheckCommands(program: Command): void {
  program
    .command('check')
    .description('Check .env file against .env.example for missing or extra keys')
    .option('-e, --env <path>', 'Path to .env file', '.env')
    .option('-x, --example <path>', 'Path to .env.example file', '.env.example')
    .option('--strict', 'Fail if extra keys exist in .env that are not in .env.example', false)
    .action((opts) => {
      const envPath = path.resolve(opts.env);
      const examplePath = path.resolve(opts.example);

      if (!fs.existsSync(envPath)) {
        console.error(`Error: .env file not found at ${envPath}`);
        process.exit(1);
      }

      if (!fs.existsSync(examplePath)) {
        console.error(`Error: .env.example file not found at ${examplePath}`);
        process.exit(1);
      }

      const envContent = fs.readFileSync(envPath, 'utf-8');
      const exampleContent = fs.readFileSync(examplePath, 'utf-8');

      const result = checkEnvAgainstExample(envContent, exampleContent);
      console.log(formatCheckResult(result));

      const hasMissing = result.missing.length > 0;
      const hasExtra = opts.strict && result.extra.length > 0;

      if (hasMissing || hasExtra) {
        process.exit(1);
      }
    });
}
