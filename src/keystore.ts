import * as fs from 'fs';
import * as crypto from 'crypto';
import { EnvsyncConfig, ensureKeyDir } from './config';

const KEY_BYTE_LENGTH = 32;

export function generateKey(): Buffer {
  return crypto.randomBytes(KEY_BYTE_LENGTH);
}

export function saveKey(key: Buffer, config: EnvsyncConfig): void {
  ensureKeyDir(config);
  fs.writeFileSync(config.keyFile, key.toString('hex') + '\n', {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export function loadKey(config: EnvsyncConfig): Buffer {
  if (!fs.existsSync(config.keyFile)) {
    throw new Error(
      `Key file not found at ${config.keyFile}. Run 'envsync init' to generate a key.`
    );
  }

  const raw = fs.readFileSync(config.keyFile, 'utf-8').trim();

  if (!/^[0-9a-f]{64}$/i.test(raw)) {
    throw new Error(`Key file at ${config.keyFile} is invalid or corrupted.`);
  }

  return Buffer.from(raw, 'hex');
}

export function keyExists(config: EnvsyncConfig): boolean {
  return fs.existsSync(config.keyFile);
}

export function initKey(config: EnvsyncConfig, force: boolean = false): Buffer {
  if (keyExists(config) && !force) {
    throw new Error(
      `Key already exists at ${config.keyFile}. Use --force to overwrite.`
    );
  }
  const key = generateKey();
  saveKey(key, config);
  return key;
}

export function exportKeyHex(config: EnvsyncConfig): string {
  const key = loadKey(config);
  return key.toString('hex');
}

export function importKeyHex(hex: string, config: EnvsyncConfig): void {
  if (!/^[0-9a-f]{64}$/i.test(hex.trim())) {
    throw new Error('Invalid key hex string. Expected 64 hex characters.');
  }
  const key = Buffer.from(hex.trim(), 'hex');
  saveKey(key, config);
}
