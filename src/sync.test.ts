import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushEnv, pullEnv } from './sync';
import * as crypto from './crypto';
import * as git from './git';
import * as store from './store';

vi.mock('./crypto');
vi.mock('./git');
vi.mock('./store');

const mockKey = {} as CryptoKey;
const mockVars = { API_KEY: 'secret', NODE_ENV: 'production' };
const mockPlaintext = 'API_KEY=secret\nNODE_ENV=production';
const mockEncrypted = 'encrypted-base64-string';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(crypto.deriveKey).mockResolvedValue(mockKey);
  vi.mocked(crypto.encrypt).mockResolvedValue(mockEncrypted);
  vi.mocked(crypto.decrypt).mockResolvedValue(mockPlaintext);
  vi.mocked(store.formatEnvFile).mockReturnValue(mockPlaintext);
  vi.mocked(store.parseEnvFile).mockReturnValue(mockVars);
  vi.mocked(git.gitNotesAdd).mockResolvedValue(undefined);
  vi.mocked(git.gitNotesPush).mockResolvedValue(undefined);
  vi.mocked(git.gitNotesFetch).mockResolvedValue(undefined);
  vi.mocked(git.gitNotesShow).mockResolvedValue(mockEncrypted);
});

describe('pushEnv', () => {
  it('should encrypt and push env vars', async () => {
    const result = await pushEnv(mockVars, { passphrase: 'mypassword' });
    expect(result.success).toBe(true);
    expect(crypto.deriveKey).toHaveBeenCalledWith('mypassword');
    expect(crypto.encrypt).toHaveBeenCalledWith(mockPlaintext, mockKey);
    expect(git.gitNotesAdd).toHaveBeenCalledWith('HEAD', mockEncrypted);
    expect(git.gitNotesPush).toHaveBeenCalledWith('origin');
  });

  it('should return failure on error', async () => {
    vi.mocked(git.gitNotesPush).mockRejectedValue(new Error('network error'));
    const result = await pushEnv(mockVars, { passphrase: 'mypassword' });
    expect(result.success).toBe(false);
    expect(result.message).toContain('network error');
  });
});

describe('pullEnv', () => {
  it('should fetch, decrypt and return env vars', async () => {
    const result = await pullEnv({ passphrase: 'mypassword' });
    expect(result.success).toBe(true);
    expect(result.vars).toEqual(mockVars);
    expect(git.gitNotesFetch).toHaveBeenCalledWith('origin');
    expect(crypto.decrypt).toHaveBeenCalledWith(mockEncrypted, mockKey);
  });

  it('should return failure if no note found', async () => {
    vi.mocked(git.gitNotesShow).mockResolvedValue(null);
    const result = await pullEnv({ passphrase: 'mypassword' });
    expect(result.success).toBe(false);
    expect(result.message).toContain('No env note found');
  });

  it('should return failure on decryption error', async () => {
    vi.mocked(crypto.decrypt).mockRejectedValue(new Error('bad passphrase'));
    const result = await pullEnv({ passphrase: 'wrongpassword' });
    expect(result.success).toBe(false);
    expect(result.message).toContain('bad passphrase');
  });
});
