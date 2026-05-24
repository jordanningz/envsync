import { Command } from 'commander';
import fs from 'fs';
import { searchEnvFile, formatSearchResults, SearchOptions } from './env-search';

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('Search for keys or values in the env file')
    .option('-f, --file <path>', 'path to .env file', '.env')
    .option('-c, --case-sensitive', 'enable case-sensitive search', false)
    .option('-k, --keys-only', 'search keys only', false)
    .option('-v, --values-only', 'search values only', false)
    .option('-r, --regex', 'treat query as a regular expression', false)
    .action((query: string, opts) => {
      const filePath: string = opts.file;

      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      const options: SearchOptions = {
        caseSensitive: opts.caseSensitive,
        keysOnly: opts.keysOnly,
        valuesOnly: opts.valuesOnly,
        regex: opts.regex,
      };

      try {
        const results = searchEnvFile(content, query, options);
        console.log(formatSearchResults(results, query));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Search error: ${message}`);
        process.exit(1);
      }
    });
}
