import { Command } from 'commander';
import { getEnvStatus, formatStatusReport } from './env-status';

export function registerStatusCommands(program: Command): void {
  program
    .command('status')
    .description('Show sync status between local .env and remote git notes')
    .option('-f, --file <path>', 'Path to .env file', '.env')
    .option('-r, --ref <commit>', 'Git commit ref to compare against', 'HEAD')
    .option('--json', 'Output as JSON')
    .action(async (opts: { file: string; ref: string; json?: boolean }) => {
      try {
        const report = await getEnvStatus(opts.file, opts.ref);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        console.log(formatStatusReport(report));

        if (report.outOfSync > 0 || report.missingLocally > 0 || report.missingRemotely > 0) {
          process.exitCode = 1;
        }
      } catch (err: any) {
        console.error('Error checking status:', err.message);
        process.exit(1);
      }
    });
}
