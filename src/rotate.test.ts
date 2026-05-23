import { rotateKey } from './rotate';
import * as keystore from './keystore';
import * as config from './config';
import * as git from './git';
import * as crypto from './crypto';
import * as audit from './audit';
import * as fs from 'fs';

jest.mock('./keystore');
jest.mock('./config');
jest.mock('./git');
jest.mock('./crypto');
jest.mock('./audit');
jest.mock('fs');

const mockConfig = { keyDir: '/tmp/.envsync', keyFile: 'key.bin', namespace: 'envsync' };
const mockOldKey = Buffer.from('oldkey');
const mockNewKey = Buffer.from('newkey');

beforeEach(() => {
  jest.clearAllMocks();
  (config.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
  (config.getKeyFilePath as jest.Mock).mockReturnValue('/tmp/.envsync/key.bin');
  (keystore.keyExists as jest.Mock).mockReturnValue(true);
  (keystore.generateKey as jest.Mock).mockResolvedValue(mockNewKey);
  (fs.readFileSync as jest.Mock).mockReturnValue(mockOldKey);
  (git.gitNotesList as jest.Mock).mockResolvedValue([
    { ref: 'refs/notes/envsync', commitHash: 'abc123' },
  ]);
  (git.gitNotesShow as jest.Mock).mockResolvedValue('encrypted-data');
  (crypto.decrypt as jest.Mock).mockResolvedValue('plain=value');
  (crypto.encrypt as jest.Mock).mockResolvedValue('re-encrypted-data');
  (git.gitNotesAdd as jest.Mock).mockResolvedValue(undefined);
  (audit.appendAuditEntry as jest.Mock).mockResolvedValue(undefined);
});

test('rotateKey throws if no existing key', async () => {
  (keystore.keyExists as jest.Mock).mockReturnValue(false);
  await expect(rotateKey('passphrase')).rejects.toThrow('No existing key found');
});

test('rotateKey generates a new key', async () => {
  await rotateKey('passphrase');
  expect(keystore.generateKey).toHaveBeenCalledWith(mockConfig, 'passphrase', { overwrite: true });
});

test('rotateKey re-encrypts existing notes', async () => {
  const result = await rotateKey('passphrase');
  expect(crypto.decrypt).toHaveBeenCalledWith('encrypted-data', mockOldKey);
  expect(crypto.encrypt).toHaveBeenCalledWith('plain=value', mockNewKey);
  expect(git.gitNotesAdd).toHaveBeenCalledWith('abc123', 're-encrypted-data', '.', true);
  expect(result.reEncryptedCount).toBe(1);
});

test('rotateKey appends audit entry', async () => {
  await rotateKey('passphrase');
  expect(audit.appendAuditEntry).toHaveBeenCalledWith(
    expect.objectContaining({ action: 'rotate-key' }),
    '.'
  );
});

test('rotateKey returns correct paths', async () => {
  const result = await rotateKey('passphrase');
  expect(result.oldKeyPath).toBe('/tmp/.envsync/key.bin');
  expect(result.newKeyPath).toBe('/tmp/.envsync/key.bin');
});
