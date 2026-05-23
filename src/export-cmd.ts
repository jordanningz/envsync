import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { exportEnv, writeExport, getExportExtension, ExportFormat } from './env-export';

const VALID_FORMATS: ExportFormat[] = ['dotenv', 'json', 'shell'];

export function registerExportCommands(program: Command): void {
  program
    .command('export')
    .description('Export the current .env to a different format')
    .argument('[input]', 'Path to .env file', '.env')
    .option('-f, --format <format>', 'Output format: dotenv | json | shell', 'dotenv')
    .option('-o, --output <path>', 'Output file path (defaults to stdout)')
    .action((input: string, opts: { format: string; output?: string }) => {
      const format = opts.format as ExportFormat;

      if (!VALID_FORMATS.includes(format)) {
        console.error(`Invalid format "${format}". Choose from: ${VALID_FORMATS.join(', ')}`);
        process.exit(1);
      }

      if (!fs.existsSync(input)) {
        console.error(`File not found: ${input}`);
        process.exit(1);
      }

      const content = fs.readFileSync(input, 'utf-8');

      if (opts.output) {
        const outPath = opts.output.includes('.')
          ? opts.output
          : opts.output + getExportExtension(format);
        writeExport(outPath, content, format);
        console.log(`Exported to ${path.resolve(outPath)}`);
      } else {
        const result = exportEnv(content, format);
        process.stdout.write(result + '\n');
      }
    });
}
