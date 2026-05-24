import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { lintEnvFile, formatLintResults } from './env-lint';

export function registerLintCommands(program: Command): void {
  program
    .command('lint [file]')
    .description('Lint a .env file for common issues')
    .option('--strict', 'Exit with non-zero code if issues are found')
    .option(
      '--rules <rules>',
      'Comma-separated list of rule names to enable',
      ''
    )
    .action((file: string | undefined, opts: { strict?: boolean; rules?: string }) => {
      const target = file
        ? path.resolve(file)
        : path.resolve(process.cwd(), '.env');

      if (!fs.existsSync(target)) {
        console.error(`File not found: ${target}`);
        process.exit(1);
      }

      const content = fs.readFileSync(target, 'utf-8');
      const { DEFAULT_RULES } = require('./env-lint');

      let rules = DEFAULT_RULES;
      if (opts.rules) {
        const names = opts.rules.split(',').map((s: string) => s.trim());
        rules = DEFAULT_RULES.filter((r: { name: string }) =>
          names.includes(r.name)
        );
      }

      const results = lintEnvFile(content, rules);
      console.log(formatLintResults(results));

      if (opts.strict && results.length > 0) {
        process.exit(1);
      }
    });
}
