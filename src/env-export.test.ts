import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  exportEnv,
  shellQuote,
  writeExport,
  getExportExtension,
} from './env-export';

const SAMPLE = 'API_KEY=abc123\nDB_URL=postgres://localhost/db\nDEBUG=true';

describe('exportEnv', () => {
  it('exports dotenv format unchanged', () => {
    const result = exportEnv(SAMPLE, 'dotenv');
    expect(result).toContain('API_KEY=abc123');
    expect(result).toContain('DB_URL=postgres://localhost/db');
  });

  it('exports json format as valid JSON', () => {
    const result = exportEnv(SAMPLE, 'json');
    const parsed = JSON.parse(result);
    expect(parsed.API_KEY).toBe('abc123');
    expect(parsed.DEBUG).toBe('true');
  });

  it('exports shell format with export prefix', () => {
    const result = exportEnv(SAMPLE, 'shell');
    expect(result).toContain('export API_KEY=abc123');
    expect(result).toContain('export DEBUG=true');
  });
});

describe('shellQuote', () => {
  it('returns plain value when no special chars', () => {
    expect(shellQuote('simple')).toBe('simple');
  });

  it('wraps value with spaces in single quotes', () => {
    expect(shellQuote('hello world')).toContain("'");
  });

  it('escapes single quotes inside value', () => {
    const result = shellQuote("it's here");
    expect(result).toContain("'it'\\''s here'");
  });
});

describe('writeExport', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-export-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes exported content to file', () => {
    const outPath = path.join(tmpDir, 'out.json');
    writeExport(outPath, SAMPLE, 'json');
    const written = fs.readFileSync(outPath, 'utf-8');
    const parsed = JSON.parse(written);
    expect(parsed.API_KEY).toBe('abc123');
  });
});

describe('getExportExtension', () => {
  it('returns .json for json', () => expect(getExportExtension('json')).toBe('.json'));
  it('returns .sh for shell', () => expect(getExportExtension('shell')).toBe('.sh'));
  it('returns .env for dotenv', () => expect(getExportExtension('dotenv')).toBe('.env'));
});
