import { generateKey, keyExists } from './keystore';
import { getKeyFilePath, ensureKeyDir } from './config';
import { encrypt, decrypt } from './crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface InvitePayload {
  version: number;
  encryptedKey: string;
  salt: string;
  iv: string;
  createdAt: string;
}

/**
 * Creates an invite token by encrypting the team key with a one-time passphrase.
 */
export async function createInvite(
  passphrase: string,
  keyFilePath?: string
): Promise<string> {
  const filePath = keyFilePath ?? getKeyFilePath();
  if (!fs.existsSync(filePath)) {
    throw new Error('No team key found. Run `envsync init` first.');
  }
  const teamKey = fs.readFileSync(filePath, 'utf-8').trim();
  const { ciphertext, iv, salt } = await encrypt(teamKey, passphrase);
  const payload: InvitePayload = {
    version: 1,
    encryptedKey: ciphertext,
    salt,
    iv,
    createdAt: new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Accepts an invite token, decrypts the team key, and stores it locally.
 */
export async function acceptInvite(
  token: string,
  passphrase: string,
  keyFilePath?: string
): Promise<void> {
  const filePath = keyFilePath ?? getKeyFilePath();
  let payload: InvitePayload;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
  } catch {
    throw new Error('Invalid invite token.');
  }
  if (payload.version !== 1) {
    throw new Error(`Unsupported invite version: ${payload.version}`);
  }
  const teamKey = await decrypt(
    payload.encryptedKey,
    passphrase,
    payload.iv,
    payload.salt
  );
  ensureKeyDir();
  fs.writeFileSync(filePath, teamKey, { mode: 0o600 });
}
