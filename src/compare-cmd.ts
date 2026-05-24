import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { compareEnvFiles, formatCompareResult, hasCompareChanges } from './env-compare';

export function registerCompareCommands(program: Command): void {
  program
    .command('compare <fileA> <fileB>')
    .description('Compare two .env files and show differences')
    .option('-l, --label-a <label>', 'Label for file A', undefined)
    .option('-r, --label-b <label>', 'Label for file B', undefined)
    .option('--exit-code', 'Exit with code 1 if differences found')
    .action(
      (
        fileA: string,
        fileB: string,
        opts: { labelA?: string; labelB?: string; exitCode?: boolean }
      ) => {
        if (!fs.existsSync(fileA)) {
          console.error(`File not found: ${fileA}`);
          process.exit(1);
        }
        if (!fs.existsSync(fileB)) {
          console.error(`File not found: ${fileB}`);
          process.exit(1);
        }

        const contentA = fs.readFileSync(fileA, 'utf8');
        const contentB = fs.readFileSync(fileB, 'utf8');

        const labelA = opts.labelA ?? path.basename(fileA);
        const labelB = opts.labelB ?? path.basename(fileB);

        const result = compareEnvFiles(contentA, contentB);
        const output = formatCompareResult(result, labelA, labelB);

        console.log(output);

        if (opts.exitCode && hasCompareChanges(result)) {
          process.exit(1);
        }
      }
    );
}
