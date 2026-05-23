import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { mergeEnvFiles, applyResolutions, MergeConflict } from './env-merge';

async function promptResolution(conflict: MergeConflict): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log(`\nConflict for key: ${conflict.key}`);
    console.log(`  [1] Base:   ${conflict.base ?? '(not set)'}`);
    console.log(`  [2] Ours:   ${conflict.ours ?? '(not set)'}`);
    console.log(`  [3] Theirs: ${conflict.theirs ?? '(not set)'}`);
    rl.question('Choose [1/2/3] or enter custom value: ', (answer) => {
      rl.close();
      if (answer === '1') resolve(conflict.base ?? '');
      else if (answer === '2') resolve(conflict.ours ?? '');
      else if (answer === '3') resolve(conflict.theirs ?? '');
      else resolve(answer);
    });
  });
}

export function registerMergeCommands(program: Command): void {
  program
    .command('merge <base> <ours> <theirs>')
    .description('Three-way merge two .env files against a common base')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .option('--no-interactive', 'Fail on conflicts instead of prompting')
    .action(async (basePath: string, oursPath: string, theirsPath: string, opts) => {
      const base = fs.readFileSync(basePath, 'utf8');
      const ours = fs.readFileSync(oursPath, 'utf8');
      const theirs = fs.readFileSync(theirsPath, 'utf8');

      const result = mergeEnvFiles(base, ours, theirs);

      let resolutions: Record<string, string> = {};

      if (result.conflicts.length > 0) {
        if (!opts.interactive) {
          console.error(`Merge has ${result.conflicts.length} conflict(s). Resolve manually or use interactive mode.`);
          process.exit(1);
        }
        for (const conflict of result.conflicts) {
          resolutions[conflict.key] = await promptResolution(conflict);
        }
      }

      const merged = applyResolutions(result, resolutions);

      if (opts.output) {
        fs.writeFileSync(opts.output, merged, 'utf8');
        console.log(`Merged env written to ${opts.output}`);
      } else {
        process.stdout.write(merged);
      }
    });
}
