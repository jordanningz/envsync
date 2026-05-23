import { Command } from 'commander';
import { registerRotateCommands, promptConfirm } from './rotate-cmd';
import * as rotate from './rotate';
import * as audit from './audit';
import * as auditCmd from './audit-cmd';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRotateCommands(program);
  return program;
}

describe('registerRotateCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(rotate, 'rotateKey').mockResolvedValue(undefined);
    jest.spyOn(audit, 'appendAuditEntry').mockResolvedValue(undefined);
    jest.spyOn(auditCmd, 'getCurrentUser').mockResolvedValue('test-user');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rotates key with --force flag skipping confirmation', async () => {
    const program = buildProgram();
    await program.parseAsync(['rotate', '--force'], { from: 'user' });

    expect(rotate.rotateKey).toHaveBeenCalledWith('default');
    expect(audit.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'rotate', user: 'test-user', env: 'default' })
    );
  });

  it('rotates key for a specific env with --force', async () => {
    const program = buildProgram();
    await program.parseAsync(['rotate', '--force', '--env', 'production'], { from: 'user' });

    expect(rotate.rotateKey).toHaveBeenCalledWith('production');
    expect(audit.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ env: 'production' })
    );
  });

  it('cancels rotation when user does not confirm', async () => {
    const program = buildProgram();
    jest.spyOn(require('./rotate-cmd'), 'promptConfirm').mockResolvedValue(false);

    // Re-register with mocked promptConfirm
    const p = new Command();
    p.exitOverride();
    registerRotateCommands(p);

    expect(rotate.rotateKey).not.toHaveBeenCalled();
  });

  it('handles rotation error gracefully', async () => {
    jest.spyOn(rotate, 'rotateKey').mockRejectedValue(new Error('rotation failed'));
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['rotate', '--force'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(console.error).toHaveBeenCalledWith('Key rotation failed:', 'rotation failed');
    mockExit.mockRestore();
  });
});
