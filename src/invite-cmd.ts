import { Command } from 'commander';
import * as readline from 'readline';
import { createInvite, acceptInvite } from './invite';

/**
 * Prompts for a passphrase without echoing input.
 */
function promptPassphrase(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // Hide input by overriding _writeToOutput
    (rl as any)._writeToOutput = (s: string) => {
      if (s === prompt) (rl as any).output.write(s);
    };
    rl.question(prompt, (answer) => {
      (rl as any).output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

export function registerInviteCommands(program: Command): void {
  const invite = program
    .command('invite')
    .description('Manage team invitations');

  invite
    .command('create')
    .description('Create an invite token protected by a one-time passphrase')
    .action(async () => {
      try {
        const passphrase = await promptPassphrase('One-time passphrase: ');
        if (!passphrase) {
          console.error('Passphrase cannot be empty.');
          process.exit(1);
        }
        const token = await createInvite(passphrase);
        console.log('\nShare this invite token with your team member:');
        console.log(`\n${token}\n`);
        console.log('⚠️  Also share the passphrase via a separate secure channel.');
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  invite
    .command('accept <token>')
    .description('Accept an invite token and install the team key locally')
    .action(async (token: string) => {
      try {
        const passphrase = await promptPassphrase('One-time passphrase: ');
        await acceptInvite(token, passphrase);
        console.log('✅ Team key installed successfully.');
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
