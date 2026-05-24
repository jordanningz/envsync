import { Command } from 'commander';
import { registerInitCommands } from './init-cmd';
import { initEnvSync, isInitialized } from './env-init';

jest.mock('./env-init', () => ({
  initEnvSync: jest.fn(),
  isInitialized: jest.fn(),
}));

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerInitCommands(program);
  return program;
}

describe('init-cmd', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('prints already initialized message when not forced', async () => {
    (isInitialized as jest.Mock).mockReturnValue(true);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
    expect(initEnvSync).not.toHaveBeenCalled();
  });

  it('calls initEnvSync with correct options', async () => {
    (isInitialized as jest.Mock).mockReturnValue(false);
    (initEnvSync as jest.Mock).mockResolvedValue({ configCreated: true, keyCreated: true, alreadyInitialized: false });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', '--notes-ref', 'refs/notes/custom']);
    expect(initEnvSync).toHaveBeenCalledWith(expect.any(String), { force: false, notesRef: 'refs/notes/custom' });
  });

  it('prints success message after init', async () => {
    (isInitialized as jest.Mock).mockReturnValue(false);
    (initEnvSync as jest.Mock).mockResolvedValue({ configCreated: true, keyCreated: true, alreadyInitialized: false });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Encryption key generated'));
  });

  it('calls initEnvSync with force flag', async () => {
    (isInitialized as jest.Mock).mockReturnValue(true);
    (initEnvSync as jest.Mock).mockResolvedValue({ configCreated: true, keyCreated: true, alreadyInitialized: false });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', '--force']);
    expect(initEnvSync).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ force: true }));
  });

  it('exits with error on failure', async () => {
    (isInitialized as jest.Mock).mockReturnValue(false);
    (initEnvSync as jest.Mock).mockRejectedValue(new Error('disk full'));
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'init'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
