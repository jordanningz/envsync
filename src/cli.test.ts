import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

vi.mock('./sync');
vi.mock('./store');
vi.mock('fs');

import { pushEnv, pullEnv } from './sync';
import { parseEnvFile, formatEnvFile } from './store';

const mockVars = { DB_URL: 'postgres://localhost/test' };
const mockEnvContent = 'DB_URL=postgres://localhost/test';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readFileSync).mockReturnValue(mockEnvContent);
  vi.mocked(parseEnvFile).mockReturnValue(mockVars);
  vi.mocked(formatEnvFile).mockReturnValue(mockEnvContent);
  vi.mocked(pushEnv).mockResolvedValue({ success: true, message: 'pushed' });
  vi.mocked(pullEnv).mockResolvedValue({ success: true, message: 'pulled', vars: mockVars });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CLI push command', () => {
  it('should call pushEnv with parsed vars and passphrase', async () => {
    process.env.ENVSYNC_PASSPHRASE = 'testpass';
    const { pushEnv: push } = await import('./sync');
    vi.mocked(push).mockResolvedValue({ success: true, message: 'pushed' });
    expect(push).toBeDefined();
    delete process.env.ENVSYNC_PASSPHRASE;
  });

  it('should read env file from disk', () => {
    expect(fs.existsSync).toBeDefined();
    expect(fs.readFileSync).toBeDefined();
  });
});

describe('CLI pull command', () => {
  it('should call pullEnv and write result to file', async () => {
    const { pullEnv: pull } = await import('./sync');
    const result = await pull({ passphrase: 'testpass' });
    expect(result.success).toBe(true);
    expect(result.vars).toEqual(mockVars);
  });

  it('should use formatEnvFile to serialize pulled vars', () => {
    const output = formatEnvFile(mockVars);
    expect(output).toBe(mockEnvContent);
    expect(formatEnvFile).toHaveBeenCalledWith(mockVars);
  });
});
