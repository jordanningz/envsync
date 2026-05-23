import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, ensureKeyDir, EnvsyncConfig } from './config';

describe('config', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('returns defaults when no config file exists', () => {
      const config = loadConfig(tmpDir);
      expect(config.notesRef).toBe('refs/notes/envsync');
      expect(config.envFile).toBe('.env');
      expect(config.keyFile).toContain('.envsync');
    });

    it('merges file values with defaults', () => {
      const partial = { notesRef: 'refs/notes/custom' };
      fs.writeFileSync(path.join(tmpDir, '.envsyncrc'), JSON.stringify(partial));
      const config = loadConfig(tmpDir);
      expect(config.notesRef).toBe('refs/notes/custom');
      expect(config.envFile).toBe('.env');
    });

    it('throws on invalid JSON', () => {
      fs.writeFileSync(path.join(tmpDir, '.envsyncrc'), 'not-json');
      expect(() => loadConfig(tmpDir)).toThrow('Failed to parse .envsyncrc');
    });
  });

  describe('saveConfig', () => {
    it('writes config to .envsyncrc', () => {
      saveConfig({ notesRef: 'refs/notes/team' }, tmpDir);
      const raw = fs.readFileSync(path.join(tmpDir, '.envsyncrc'), 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.notesRef).toBe('refs/notes/team');
    });

    it('preserves existing keys when saving partial config', () => {
      saveConfig({ envFile: 'apps/api/.env' }, tmpDir);
      saveConfig({ notesRef: 'refs/notes/v2' }, tmpDir);
      const config = loadConfig(tmpDir);
      expect(config.envFile).toBe('apps/api/.env');
      expect(config.notesRef).toBe('refs/notes/v2');
    });
  });

  describe('ensureKeyDir', () => {
    it('creates the key directory if missing', () => {
      const keyFile = path.join(tmpDir, 'nested', 'dir', 'key');
      const config: EnvsyncConfig = { notesRef: 'refs/notes/envsync', envFile: '.env', keyFile };
      ensureKeyDir(config);
      expect(fs.existsSync(path.dirname(keyFile))).toBe(true);
    });
  });
});
