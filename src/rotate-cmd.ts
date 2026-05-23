import { Command } from 'commander';
import * as readline from 'readline';
import { rotateKey } from './rotate';
import { appendAuditEntry } from './audit';
import { getCurrentUser } from './audit-cmd';

export function promptConfirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

export function registerRotateCommands(program: Command): void {
  program
    .command('rotate')
    .description('Rotate the encryption key and re-encrypt all stored .env data')
    .option('-f, --force', 'Skip confirmation prompt', false)
    .option('-e, --env <name>', 'Environment name to rotate', 'default')
    .action(async (options) => {
      try {
        if (!options.force) {
          const confirmed = await promptConfirm(
            `Are you sure you want to rotate the key for env "${options.env}"? This will re-encrypt all data. (y/N): `
          );
          if (!confirmed) {
            console.log('Key rotation cancelled.');
            return;
          }
        }

        console.log(`Rotating key for environment: ${options.env}...`);
        await rotateKey(options.env);

        const user = await getCurrentUser();
        await appendAuditEntry({
          action: 'rotate',
          user,
          env: options.env,
          timestamp: new Date().toISOString(),
        });

        console.log('Key rotation complete. All team members must run `envsync pull` to get the updated data.');
      } catch (err) {
        console.error('Key rotation failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
