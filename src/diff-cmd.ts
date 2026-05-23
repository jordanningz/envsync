import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { diffEnvFiles, formatDiff, hasDiff } from './diff';
import { decrypt } from './crypto';
import { gitNotesShow } from './git';
import { loadConfig } from './config';
import { generateKey, keyExists } from './keystore';

export function registerDiffCommands(program: Command): void {
  program
    .command('diff')
    .description('Show diff between local .env and the synced remote version')
    .option('-f, --file <path>', '.env file path', '.env')
    .option('--show-values', 'Show actual values instead of masking them', false)
    .option('--ref <commit>', 'Git commit ref to compare against', 'HEAD')
    .action(async (options) => {
      try {
        const config = await loadConfig();

        if (!keyExists(config.keyId)) {
          console.error('No encryption key found. Run `envsync init` first.');
          process.exit(1);
        }

        const localPath = path.resolve(options.file);
        if (!fs.existsSync(localPath)) {
          console.error(`Local file not found: ${localPath}`);
          process.exit(1);
        }

        const localContent = fs.readFileSync(localPath, 'utf-8');

        let remoteEncrypted: string;
        try {
          remoteEncrypted = await gitNotesShow(options.ref);
        } catch {
          console.log('No remote .env found for this ref. Nothing to compare.');
          process.exit(0);
        }

        const key = generateKey(config.keyId);
        const remoteContent = await decrypt(remoteEncrypted, key);

        const diff = diffEnvFiles(remoteContent, localContent);

        if (!hasDiff(diff)) {
          console.log('Your .env is in sync with the remote version.');
          return;
        }

        console.log(`Diff for ${options.file} (remote -> local):`);
        console.log(formatDiff(diff, !options.showValues));
      } catch (err) {
        console.error('Error computing diff:', (err as Error).message);
        process.exit(1);
      }
    });
}
