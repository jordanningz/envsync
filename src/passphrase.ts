import * as readline from 'readline';
import * as crypto from 'crypto';

/**
 * Prompt the user for a passphrase without echoing input.
 */
export async function promptPassphrase(prompt: string = 'Enter passphrase: '): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    // Hide input if TTY
    if (process.stdin.isTTY) {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);

      let passphrase = '';
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char: string) => {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(passphrase);
        } else if (char === '\u0003') {
          process.stdin.setRawMode(false);
          rl.close();
          reject(new Error('Passphrase entry cancelled'));
        } else if (char === '\u007f') {
          passphrase = passphrase.slice(0, -1);
        } else {
          passphrase += char;
        }
      };

      process.stdin.on('data', onData);
    } else {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

/**
 * Prompt for passphrase twice and confirm they match.
 */
export async function promptPassphraseConfirm(): Promise<string> {
  const first = await promptPassphrase('Enter new passphrase: ');
  if (first.length < 8) {
    throw new Error('Passphrase must be at least 8 characters');
  }
  const second = await promptPassphrase('Confirm passphrase: ');
  if (first !== second) {
    throw new Error('Passphrases do not match');
  }
  return first;
}

/**
 * Hash a passphrase using SHA-256 for use as a key identifier (not for encryption).
 */
export function hashPassphrase(passphrase: string): string {
  return crypto.createHash('sha256').update(passphrase).digest('hex');
}
