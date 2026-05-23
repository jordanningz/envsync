import { Command } from 'commander';
import * as path from 'path';
import { watchEnvFile } from './env-watch';
import { formatDiff } from './diff';

export function registerWatchCommands(program: Command): void {
  program
    .command('watch [file]')
    .description('Watch a .env file and print changes as they occur')
    .option('-i, --interval <ms>', 'polling interval in milliseconds', '1000')
    .action((file: string | undefined, opts: { interval: string }) => {
      const target = path.resolve(file ?? '.env');
      const interval = parseInt(opts.interval, 10);

      console.log(`Watching ${target} (interval: ${interval}ms) — Ctrl+C to stop`);

      const handle = watchEnvFile(target, {
        interval,
        onChange: (diff) => {
          const timestamp = new Date().toISOString();
          console.log(`\n[${timestamp}] Changes detected:`);
          console.log(formatDiff(diff));
        },
        onError: (err) => {
          console.error(`Watch error: ${err.message}`);
        },
      });

      process.on('SIGINT', () => {
        handle.stop();
        console.log('\nWatch stopped.');
        process.exit(0);
      });
    });
}
