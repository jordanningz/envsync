import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { deriveKey, encrypt, decrypt } from './crypto';
import { getKeyFilePath, ensureKeyDir } from './config';

const KEY_LENGTH = 32; // 256-bit key

export function generateKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

export async function saveKey(key: Buffer, passphrase: string): Promise<void> {
  await ensureKeyDir();
  const keyPath = getKeyFilePath();
  const encrypted = await encrypt(key.toString('hex'), passphrase);
  fs.writeFileSync(keyPath, JSON.stringify(encrypted), { mode: 0o600 });
}

export async function loadKey(passphrase: string): Promise<Buffer> {
  const keyPath = getKeyFilePath();
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Key file not found at ${keyPath}. Run 'envsync init' first.`);
  }
  const raw = fs.readFileSync(keyPath, 'utf8');
  const encrypted = JSON.parse(raw);
  const hex = await decrypt(encrypted, passphrase);
  return Buffer.from(hex, 'hex');
}

export function keyExists(): boolean {
  const keyPath = getKeyFilePath();
  return fs.existsSync(keyPath);
}

export async function initKey(passphrase: string): Promise<Buffer> {
  if (keyExists()) {
    throw new Error('Key already exists. Use --force to overwrite.');
  }
  const key = generateKey();
  await saveKey(key, passphrase);
  return key;
}

export async function rotateKey(
  oldPassphrase: string,
  newPassphrase: string
): Promise<Buffer> {
  const existing = await loadKey(oldPassphrase);
  await saveKey(existing, newPassphrase);
  return existing;
}

export async function exportKey(passphrase: string): Promise<string> {
  const key = await loadKey(passphrase);
  return key.toString('base64');
}
