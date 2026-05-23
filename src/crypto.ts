import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Layout: salt (16) | iv (12) | tag (16) | ciphertext
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

export function decrypt(ciphertext: string, passphrase: string): string {
  const buf = Buffer.from(ciphertext, 'base64');

  if (buf.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid ciphertext: buffer too short');
  }

  let offset = 0;
  const salt = buf.subarray(offset, (offset += SALT_LENGTH));
  const iv = buf.subarray(offset, (offset += IV_LENGTH));
  const tag = buf.subarray(offset, (offset += TAG_LENGTH));
  const encrypted = buf.subarray(offset);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed: wrong passphrase or corrupted data');
  }
}
