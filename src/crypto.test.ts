import { encrypt, decrypt, deriveKey } from './crypto';
import * as crypto from 'crypto';

describe('deriveKey', () => {
  it('produces a 32-byte key', () => {
    const salt = crypto.randomBytes(16);
    const key = deriveKey('secret', salt);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('produces the same key for the same passphrase and salt', () => {
    const salt = crypto.randomBytes(16);
    const key1 = deriveKey('mysecret', salt);
    const key2 = deriveKey('mysecret', salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('produces different keys for different passphrases', () => {
    const salt = crypto.randomBytes(16);
    const key1 = deriveKey('passA', salt);
    const key2 = deriveKey('passB', salt);
    expect(key1.equals(key2)).toBe(false);
  });
});

describe('encrypt / decrypt', () => {
  const passphrase = 'super-secret-passphrase';
  const plaintext = 'DB_PASSWORD=hunter2\nAPI_KEY=abc123';

  it('round-trips plaintext correctly', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    const result = decrypt(ciphertext, passphrase);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertext on each call (random IV/salt)', () => {
    const c1 = encrypt(plaintext, passphrase);
    const c2 = encrypt(plaintext, passphrase);
    expect(c1).not.toBe(c2);
  });

  it('throws on wrong passphrase', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    expect(() => decrypt(ciphertext, 'wrong-passphrase')).toThrow(
      'Decryption failed: wrong passphrase or corrupted data'
    );
  });

  it('throws on corrupted ciphertext', () => {
    expect(() => decrypt('bm90YmFzZTY0', passphrase)).toThrow();
  });

  it('returns a base64 string', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    expect(() => Buffer.from(ciphertext, 'base64')).not.toThrow();
    expect(ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});
