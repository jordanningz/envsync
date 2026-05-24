import { Command } from 'commander';
import * as path from 'path';
import { initEnvSync, isInitialized } from './env-init';

export function registerInitCommands(program: Command): void {
  program
    .command('init')
    .description('Initialize envsync in the current repository')
    .option('--force', 'Re-initialize even if already set up', false)
    .option('--notes-ref <ref>', 'Git notes ref to use', 'refs/notes/envsync')
    .action(async (opts) => {
      const repoPath = process.cwd();

      if (isInitialized(repoPath) && !opts.force) {
        console.log('envsync is already initialized in this repository.');
        console.log('Use --force to re-initialize.');
        return;
      }

      try {
        const result = await initEnvSync(repoPath, {
          force: opts.force,
          notesRef: opts.notesRef,
        });

        if (result.alreadyInitialized) {
          console.log('envsync is already initialized in this repository.');
          return;
        }

        console.log('✓ envsync initialized successfully.');
        if (result.keyCreated) {
          console.log('✓ Encryption key generated.');
        }
        console.log(`✓ Using notes ref: ${opts.notesRef}`);
        console.log('');
        console.log('Next steps:');
        console.log('  1. Run `envsync push` to encrypt and push your .env file.');
        console.log('  2. Share your key with teammates using `envsync invite`.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error initializing envsync: ${message}`);
        process.exit(1);
      }
    });
}
