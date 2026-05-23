import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerExportCommands } from './export-cmd';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerExportCommands(program);
  return program;
}

let tmpDir: string;
let envFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-export-cmd-'));
  envFile = path.join(tmpDir, '.env');
  fs.writeFileSync(envFile, 'KEY=value\nNAME=envsync');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('export command', () => {
  it('writes json output to file', () => {
    const outFile = path.join(tmpDir, 'out.json');
    const program = buildProgram();
    program.parse(['export', envFile, '--format', 'json', '--output', outFile], { from: 'user' });
    const parsed = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    expect(parsed.KEY).toBe('value');
    expect(parsed.NAME).toBe('envsync');
  });

  it('writes shell output to file', () => {
    const outFile = path.join(tmpDir, 'out.sh');
    const program = buildProgram();
    program.parse(['export', envFile, '--format', 'shell', '--output', outFile], { from: 'user' });
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('export KEY=value');
  });

  it('prints to stdout when no output path given', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const program = buildProgram();
    program.parse(['export', envFile, '--format', 'dotenv'], { from: 'user' });
    expect(writeSpy).toHaveBeenCalled();
    const written = writeSpy.mock.calls[0][0] as string;
    expect(written).toContain('KEY=value');
  });

  it('exits with error for invalid format', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    program.parse(['export', envFile, '--format', 'xml'], { from: 'user' });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid format'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when input file missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    program.parse(['export', '/nonexistent/.env'], { from: 'user' });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
