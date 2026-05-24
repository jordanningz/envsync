import type { Command } from 'commander';
import fs from 'fs';
import { renameEnvKey } from './env-rename';

export function registerRenameCommands(program: Command): void {
  program
    .command('rename <oldKey> <newKey>')
    .description('Rename a key in the local .env file')
    .option('-f, --file <path>', 'Path to env file', '.env')
    .option('--dry-run', 'Preview the rename without writing changes')
    .action((oldKey: string, newKey: string, opts: { file: string; dryRun?: boolean }) => {
      const filePath = opts.file;

      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const original = fs.readFileSync(filePath, 'utf8');
      const { content, result } = renameEnvKey(original, oldKey, newKey);

      if (!result.success) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }

      if (opts.dryRun) {
        console.log(`[dry-run] Would rename "${oldKey}" → "${newKey}" in ${filePath}`);
        console.log('--- preview ---');
        console.log(content);
        return;
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Renamed "${oldKey}" → "${newKey}" in ${filePath}`);
    });
}
