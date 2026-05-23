#!/usr/bin/env node
import { Command } from 'commander';
import { pushEnv, pullEnv } from './sync';
import { parseEnvFile, formatEnvFile } from './store';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('envsync')
  .description('Sync .env files securely across team members using encrypted git notes')
  .version('0.1.0');

program
  .command('push')
  .description('Encrypt and push local .env to git notes')
  .option('-f, --file <path>', '.env file to push', '.env')
  .option('-p, --passphrase <string>', 'Encryption passphrase')
  .option('-r, --remote <string>', 'Git remote', 'origin')
  .action(async (opts) => {
    const passphrase = opts.passphrase || process.env.ENVSYNC_PASSPHRASE;
    if (!passphrase) {
      console.error('Error: passphrase is required (--passphrase or ENVSYNC_PASSPHRASE)');
      process.exit(1);
    }
    const filePath = path.resolve(opts.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${filePath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const vars = parseEnvFile(content);
    const result = await pushEnv(vars, { passphrase, remote: opts.remote });
    console.log(result.success ? `✓ ${result.message}` : `✗ ${result.message}`);
    if (!result.success) process.exit(1);
  });

program
  .command('pull')
  .description('Fetch and decrypt .env from git notes')
  .option('-f, --file <path>', '.env file to write', '.env')
  .option('-p, --passphrase <string>', 'Encryption passphrase')
  .option('-r, --remote <string>', 'Git remote', 'origin')
  .action(async (opts) => {
    const passphrase = opts.passphrase || process.env.ENVSYNC_PASSPHRASE;
    if (!passphrase) {
      console.error('Error: passphrase is required (--passphrase or ENVSYNC_PASSPHRASE)');
      process.exit(1);
    }
    const result = await pullEnv({ passphrase, remote: opts.remote });
    if (!result.success || !result.vars) {
      console.error(`✗ ${result.message}`);
      process.exit(1);
    }
    const filePath = path.resolve(opts.file);
    fs.writeFileSync(filePath, formatEnvFile(result.vars), 'utf-8');
    console.log(`✓ ${result.message} Written to ${filePath}`);
  });

program.parse();
