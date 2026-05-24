import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initEnvSync, isInitialized } from './env-init';
import { saveConfig } from './config';
import { generateKey } from './keystore';

jest.mock('./config', () => ({
  loadConfig: jest.fn().mockReturnValue(null),
  saveConfig: jest.fn(),
  getKeyFilePath: jest.fn((r: string) => path.join(r, '.envsync-key')),
  ensureKeyDir: jest.fn(),
}));

jest.mock('./keystore', () => ({
  generateKey: jest.fn().mockResolvedValue(undefined),
  keyExists: jest.fn().mockReturnValue(false),
}));

jest.mock('./audit', () => ({
  appendAuditEntry: jest.fn().mockResolvedValue(undefined),
}));

import { keyExists } from './keystore';

describe('initEnvSync', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-init-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates config and key on first init', async () => {
    const result = await initEnvSync(tmpDir);
    expect(result.configCreated).toBe(true);
    expect(result.keyCreated).toBe(true);
    expect(result.alreadyInitialized).toBe(false);
    expect(saveConfig).toHaveBeenCalledWith(tmpDir, expect.objectContaining({ notesRef: 'refs/notes/envsync' }));
    expect(generateKey).toHaveBeenCalledWith(tmpDir);
  });

  it('uses custom notesRef when provided', async () => {
    await initEnvSync(tmpDir, { notesRef: 'refs/notes/custom' });
    expect(saveConfig).toHaveBeenCalledWith(tmpDir, expect.objectContaining({ notesRef: 'refs/notes/custom' }));
  });

  it('returns alreadyInitialized when config and key exist', async () => {
    const configPath = path.join(tmpDir, '.envsync.json');
    fs.writeFileSync(configPath, JSON.stringify({ notesRef: 'refs/notes/envsync' }));
    (keyExists as jest.Mock).mockReturnValue(true);
    const result = await initEnvSync(tmpDir);
    expect(result.alreadyInitialized).toBe(true);
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('re-initializes when force is true', async () => {
    const configPath = path.join(tmpDir, '.envsync.json');
    fs.writeFileSync(configPath, JSON.stringify({ notesRef: 'refs/notes/envsync' }));
    (keyExists as jest.Mock).mockReturnValue(true);
    const result = await initEnvSync(tmpDir, { force: true });
    expect(result.alreadyInitialized).toBe(false);
    expect(result.configCreated).toBe(true);
    expect(generateKey).toHaveBeenCalled();
  });
});

describe('isInitialized', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-check-'));
    (keyExists as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns false when not initialized', () => {
    expect(isInitialized(tmpDir)).toBe(false);
  });

  it('returns true when config and key exist', () => {
    fs.writeFileSync(path.join(tmpDir, '.envsync.json'), '{}');
    (keyExists as jest.Mock).mockReturnValue(true);
    expect(isInitialized(tmpDir)).toBe(true);
  });
});
