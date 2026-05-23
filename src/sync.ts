import { encrypt, decrypt, deriveKey } from './crypto';
import { gitNotesAdd, gitNotesShow, gitNotesFetch, gitNotesPush } from './git';
import { formatEnvFile, parseEnvFile } from './store';

export interface SyncOptions {
  passphrase: string;
  ref?: string;
  remote?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  vars?: Record<string, string>;
}

export async function pushEnv(
  vars: Record<string, string>,
  options: SyncOptions
): Promise<SyncResult> {
  const { passphrase, ref = 'HEAD', remote = 'origin' } = options;
  try {
    const key = await deriveKey(passphrase);
    const plaintext = formatEnvFile(vars);
    const encrypted = await encrypt(plaintext, key);
    await gitNotesAdd(ref, encrypted);
    await gitNotesPush(remote);
    return { success: true, message: 'Environment variables pushed successfully.' };
  } catch (err: any) {
    return { success: false, message: `Push failed: ${err.message}` };
  }
}

export async function pullEnv(
  options: SyncOptions
): Promise<SyncResult> {
  const { passphrase, ref = 'HEAD', remote = 'origin' } = options;
  try {
    await gitNotesFetch(remote);
    const key = await deriveKey(passphrase);
    const encrypted = await gitNotesShow(ref);
    if (!encrypted) {
      return { success: false, message: 'No env note found for this ref.' };
    }
    const plaintext = await decrypt(encrypted, key);
    const vars = parseEnvFile(plaintext);
    return { success: true, message: 'Environment variables pulled successfully.', vars };
  } catch (err: any) {
    return { success: false, message: `Pull failed: ${err.message}` };
  }
}
