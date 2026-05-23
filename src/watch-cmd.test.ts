import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerWatchCommands } from './watch-cmd';
import * as envWatch from './env-watch';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerWatchCommands(program);
  return program;
}

describe('registerWatchCommands', () => {
  let stopMock: jest.Mock;
  let watchSpy: jest.SpyInstance;

  beforeEach(() => {
    stopMock = jest.fn();
    watchSpy = jest
      .spyOn(envWatch, 'watchEnvFile')
      .mockReturnValue({ stop: stopMock });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers the watch command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('calls watchEnvFile with default .env path and interval', () => {
    const program = buildProgram();
    // Prevent process.on from interfering
    const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);

    program.parse(['node', 'cli', 'watch']);

    expect(watchSpy).toHaveBeenCalledWith(
      expect.stringContaining('.env'),
      expect.objectContaining({ interval: 1000 })
    );
    onSpy.mockRestore();
  });

  it('passes custom interval from --interval flag', () => {
    const program = buildProgram();
    const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);

    program.parse(['node', 'cli', 'watch', '--interval', '500']);

    expect(watchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ interval: 500 })
    );
    onSpy.mockRestore();
  });

  it('passes custom file path', () => {
    const program = buildProgram();
    const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);

    program.parse(['node', 'cli', 'watch', '.env.local']);

    expect(watchSpy).toHaveBeenCalledWith(
      expect.stringContaining('.env.local'),
      expect.any(Object)
    );
    onSpy.mockRestore();
  });
});
