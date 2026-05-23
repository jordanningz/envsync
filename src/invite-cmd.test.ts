import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerInviteCommands } from './invite-cmd';
import * as inviteModule from './invite';

vi.mock('./invite', () => ({
  createInvite: vi.fn(),
  acceptInvite: vi.fn(),
}));

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const mockPassphrase = 'test-pass-123';

// Patch promptPassphrase by mocking readline
vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    _writeToOutput: vi.fn(),
    question: (_: string, cb: (a: string) => void) => cb(mockPassphrase),
    close: vi.fn(),
    output: { write: vi.fn() },
  })),
}));

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride(); // prevent process.exit in tests
  registerInviteCommands(program);
  return program;
}

describe('invite create command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls createInvite with the entered passphrase', async () => {
    vi.mocked(inviteModule.createInvite).mockResolvedValue('token123');
    const program = buildProgram();
    await program.parseAsync(['node', 'envsync', 'invite', 'create']);
    expect(inviteModule.createInvite).toHaveBeenCalledWith(mockPassphrase);
  });

  it('logs the returned token', async () => {
    vi.mocked(inviteModule.createInvite).mockResolvedValue('mytoken');
    const program = buildProgram();
    await program.parseAsync(['node', 'envsync', 'invite', 'create']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('mytoken'));
  });
});

describe('invite accept command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls acceptInvite with token and passphrase', async () => {
    vi.mocked(inviteModule.acceptInvite).mockResolvedValue(undefined);
    const program = buildProgram();
    await program.parseAsync(['node', 'envsync', 'invite', 'accept', 'sometoken']);
    expect(inviteModule.acceptInvite).toHaveBeenCalledWith('sometoken', mockPassphrase);
  });

  it('logs success message on acceptance', async () => {
    vi.mocked(inviteModule.acceptInvite).mockResolvedValue(undefined);
    const program = buildProgram();
    await program.parseAsync(['node', 'envsync', 'invite', 'accept', 'tok']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
  });
});
