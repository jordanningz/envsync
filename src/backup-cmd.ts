import { Command } from 'commander';
import * as path from 'path';
import { createBackup, listBackups, restoreBackup, deleteBackup, getBackupDir } from './env-backup';

export function registerBackupCommands(program: Command): void {
  const backup = program.command('backup').description('Manage local .env file backups');

  backup
    .command('create <file>')
    .description('Create a backup of the specified .env file')
    .action((file: string) => {
      const absPath = path.resolve(file);
      const backupPath = createBackup(absPath);
      console.log(`Backup created: ${backupPath}`);
    });

  backup
    .command('list')
    .description('List all backups')
    .option('-f, --file <file>', 'Filter by source file')
    .action((opts: { file?: string }) => {
      const filter = opts.file ? path.resolve(opts.file) : undefined;
      const entries = listBackups(filter);
      if (entries.length === 0) {
        console.log('No backups found.');
        return;
      }
      entries.forEach(e => {
        console.log(`[${e.timestamp}] ${e.filePath}`);
      });
    });

  backup
    .command('restore <backupFile>')
    .description('Restore a backup to its original location')
    .option('-o, --output <file>', 'Restore to a different file path')
    .action((backupFile: string, opts: { output?: string }) => {
      const absBackup = path.resolve(getBackupDir(), backupFile);
      const target = opts.output ? path.resolve(opts.output) : undefined;
      restoreBackup(absBackup, target);
      console.log(`Restored ${backupFile} -> ${target ?? 'original location'}`);
    });

  backup
    .command('delete <backupFile>')
    .description('Delete a specific backup')
    .action((backupFile: string) => {
      const absBackup = path.resolve(getBackupDir(), backupFile);
      deleteBackup(absBackup);
      console.log(`Deleted backup: ${backupFile}`);
    });
}
