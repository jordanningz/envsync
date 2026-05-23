import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { acquireLock } from "./env-lock";
import { registerLockCommands } from "./lock-cmd";
import * as auditCmd from "./audit-cmd";

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerLockCommands(program);
  return program;
}

describe("lock-cmd", () => {
  let tmpDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envsync-lock-cmd-"));
    originalCwd = process.cwd.bind(process);
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    jest.spyOn(auditCmd, "getCurrentUser").mockResolvedValue("testuser");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("acquire command locks a file", async () => {
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "test", "lock", "acquire", ".env"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Locked '.env'"));
  });

  it("acquire command fails if already locked", async () => {
    acquireLock(tmpDir, ".env", "other");
    const program = buildProgram();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await program.parseAsync(["node", "test", "lock", "acquire", ".env"]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("already locked"));
  });

  it("release command releases a lock", async () => {
    acquireLock(tmpDir, ".env", "testuser");
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "test", "lock", "release", ".env"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Released lock"));
  });

  it("status command shows no locks", async () => {
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "test", "lock", "status"]);
    expect(consoleSpy).toHaveBeenCalledWith("No files are currently locked.");
  });

  it("status command shows specific file lock", async () => {
    acquireLock(tmpDir, ".env", "testuser");
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await program.parseAsync(["node", "test", "lock", "status", ".env"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("testuser"));
  });
});
