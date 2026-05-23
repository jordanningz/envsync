import { generateKey, keyExists } from './keystore';
import { loadConfig, saveConfig, getKeyFilePath } from './config';
import { appendAuditEntry } from './audit';
import { gitNotesAdd, gitNotesList } from './git';
import { encrypt, decrypt } from './crypto';
import * as fs from 'fs';

export interface RotateResult {
  oldKeyPath: string;
  newKeyPath: string;
  reEncryptedCount: number;
}

export async function rotateKey(
  passphrase: string,
  repoPath: string = '.'
): Promise<RotateResult> {
  const config = await loadConfig(repoPath);
  const oldKeyPath = getKeyFilePath(config);

  if (!keyExists(config)) {
    throw new Error('No existing key found to rotate.');
  }

  const oldKey = fs.readFileSync(oldKeyPath);

  // Generate new key
  const newKey = await generateKey(config, passphrase, { overwrite: true });
  const newKeyPath = getKeyFilePath(config);

  // Re-encrypt all existing git notes
  const notes = await gitNotesList(repoPath);
  let reEncryptedCount = 0;

  for (const { ref, commitHash } of notes) {
    try {
      const { gitNotesShow } = await import('./git');
      const encryptedData = await gitNotesShow(commitHash, repoPath);
      const plaintext = await decrypt(encryptedData, oldKey);
      const reEncrypted = await encrypt(plaintext, newKey);
      await gitNotesAdd(commitHash, reEncrypted, repoPath, true);
      reEncryptedCount++;
    } catch {
      // Skip notes that cannot be decrypted with old key
    }
  }

  await appendAuditEntry({
    action: 'rotate-key',
    user: process.env.USER || 'unknown',
    timestamp: new Date().toISOString(),
    detail: `Re-encrypted ${reEncryptedCount} note(s)`,
  }, repoPath);

  return { oldKeyPath, newKeyPath, reEncryptedCount };
}
