import { Command } from 'commander';
import * as os from 'os';
import { appendAuditEntry, readAuditLog, formatAuditLog } from './audit';

function getCurrentUser(): string {
  return os.userInfo().username || 'unknown';
}

export function registerAuditCommands(program: Command): void {
  const audit = program.command('audit').description('Manage the local audit log');

  audit
    .command('log')
    .description('Display the audit log')
    .option('-n, --limit <number>', 'Show last N entries', '20')
    .action((opts) => {
      const entries = readAuditLog();
      const limit = parseInt(opts.limit, 10);
      const slice = isNaN(limit) ? entries : entries.slice(-limit);
      console.log(formatAuditLog(slice));
    });

  audit
    .command('record <action>')
    .description('Manually record an audit entry (push|pull|invite|key-generated|key-rotated)')
    .option('-d, --details <details>', 'Optional details')
    .action((action, opts) => {
      const validActions = ['push', 'pull', 'invite', 'key-generated', 'key-rotated'] as const;
      type Action = typeof validActions[number];
      if (!validActions.includes(action as Action)) {
        console.error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
        process.exit(1);
      }
      appendAuditEntry({
        action: action as Action,
        user: getCurrentUser(),
        details: opts.details,
      });
      console.log(`Recorded audit entry: ${action}`);
    });

  audit
    .command('clear')
    .description('Clear the audit log')
    .action(() => {
      const entries = readAuditLog();
      console.log(`Cleared ${entries.length} audit entries.`);
      // Re-export to allow clearing; truncate by re-writing empty file
      const { appendAuditEntry: _a, readAuditLog: _r, ...rest } = require('./audit');
      const fs = require('fs');
      const path = require('path');
      const { getKeyFilePath } = require('./config');
      const logPath = path.join(path.dirname(getKeyFilePath()), 'audit.log');
      if (fs.existsSync(logPath)) fs.writeFileSync(logPath, '', 'utf-8');
    });
}

export { getCurrentUser };
