import { Command } from 'commander';
import { cloneEnvFile, formatCloneResult } from './env-clone';

export function registerCloneCommands(program: Command): void {
  program
    .command('clone <source> <destination>')
    .description('Clone a .env file to a new location, optionally filtering keys')
    .option('--overwrite', 'Overwrite destination if it already exists', false)
    .option(
      '--keys <keys>',
      'Comma-separated list of keys to include (default: all)'
    )
    .action(
      (source: string, destination: string, opts: { overwrite: boolean; keys?: string }) => {
        try {
          const keys = opts.keys
            ? opts.keys.split(',').map((k) => k.trim()).filter(Boolean)
            : undefined;

          const result = cloneEnvFile(source, destination, {
            overwrite: opts.overwrite,
            keys,
          });

          console.log(formatCloneResult(result));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Error: ${message}`);
          process.exit(1);
        }
      }
    );
}
