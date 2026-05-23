import { Command } from 'commander';
import { loadConfig } from './config';
import { generateKey } from './keystore';
import { listHistory, getSnapshot, formatHistory } from './env-history';
import { formatEnvFile } from './store';

export function registerHistoryCommands(program: Command): void {
  const history = program
    .command('history')
    .description('View env sync history');

  history
    .command('list')
    .description('List all synced commits')
    .option('-n, --namespace <ns>', 'git notes namespace', 'envsync')
    .action(async (opts) => {
      try {
        const entries = await listHistory(opts.namespace);
        console.log(formatHistory(entries));
      } catch (err: any) {
        console.error('Error listing history:', err.message);
        process.exit(1);
      }
    });

  history
    .command('show <commit>')
    .description('Show env snapshot at a specific commit')
    .option('-n, --namespace <ns>', 'git notes namespace', 'envsync')
    .option('--raw', 'output raw KEY=VALUE format')
    .action(async (commit, opts) => {
      try {
        const config = await loadConfig();
        const key = await generateKey(config);
        const snapshot = await getSnapshot(commit, opts.namespace, key);
        if (opts.raw) {
          console.log(formatEnvFile(snapshot.env));
        } else {
          console.log(`Commit:    ${snapshot.commit}`);
          console.log(`Timestamp: ${snapshot.timestamp}`);
          console.log('---');
          for (const [k, v] of Object.entries(snapshot.env)) {
            console.log(`${k}=${v}`);
          }
        }
      } catch (err: any) {
        console.error('Error showing snapshot:', err.message);
        process.exit(1);
      }
    });
}
