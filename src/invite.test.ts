import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createInvite, acceptInvite } from './invite';

const PASSPHRASE = 'super-secret-invite-pass';
const FAKE_KEY = 'aaaa'.repeat(8); // 32-char hex-like key

let tmpDir: string;
let keyFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-invite-'));
  keyFile = path.join(tmpDir, 'team.key');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('createInvite', () => {
  it('throws when no key file exists', async () => {
    await expect(createInvite(PASSPHRASE, keyFile)).rejects.toThrow(
      'No team key found'
    );
  });

  it('returns a base64url-encoded token', async () => {
    fs.writeFileSync(keyFile, FAKE_KEY, { mode: 0o600 });
    const token = await createInvite(PASSPHRASE, keyFile);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    // base64url has no +, /, or = padding
    expect(token).not.toMatch(/[+/=]/);
  });

  it('produces different tokens each call (random IV)', async () => {
    fs.writeFileSync(keyFile, FAKE_KEY, { mode: 0o600 });
    const t1 = await createInvite(PASSPHRASE, keyFile);
    const t2 = await createInvite(PASSPHRASE, keyFile);
    expect(t1).not.toBe(t2);
  });
});

describe('acceptInvite', () => {
  it('throws on malformed token', async () => {
    await expect(acceptInvite('not-valid!!!', PASSPHRASE, keyFile)).rejects.toThrow(
      'Invalid invite token'
    );
  });

  it('round-trips: create then accept restores the key', async () => {
    fs.writeFileSync(keyFile, FAKE_KEY, { mode: 0o600 });
    const token = await createInvite(PASSPHRASE, keyFile);

    const destKey = path.join(tmpDir, 'restored.key');
    await acceptInvite(token, PASSPHRASE, destKey);

    const restored = fs.readFileSync(destKey, 'utf-8').trim();
    expect(restored).toBe(FAKE_KEY);
  });

  it('fails with wrong passphrase', async () => {
    fs.writeFileSync(keyFile, FAKE_KEY, { mode: 0o600 });
    const token = await createInvite(PASSPHRASE, keyFile);
    const destKey = path.join(tmpDir, 'bad.key');
    await expect(acceptInvite(token, 'wrong-pass', destKey)).rejects.toThrow();
  });
});
