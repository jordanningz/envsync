import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  acquireLock,
  releaseLock,
  getLock,
  listLocks,
  getLockFilePath,
} from "./env-lock";

describe("env-lock", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envsync-lock-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("acquires a lock for a file", () => {
    const result = acquireLock(tmpDir, ".env", "alice");
    expect(result).toBe(true);
    const lock = getLock(tmpDir, ".env");
    expect(lock).toBeDefined();
    expect(lock?.lockedBy).toBe("alice");
    expect(lock?.file).toBe(".env");
  });

  it("returns false when file is already locked", () => {
    acquireLock(tmpDir, ".env", "alice");
    const result = acquireLock(tmpDir, ".env", "bob");
    expect(result).toBe(false);
  });

  it("releases a lock", () => {
    acquireLock(tmpDir, ".env", "alice");
    const result = releaseLock(tmpDir, ".env", "alice");
    expect(result).toBe(true);
    expect(getLock(tmpDir, ".env")).toBeUndefined();
  });

  it("returns false when releasing a lock not owned by user", () => {
    acquireLock(tmpDir, ".env", "alice");
    const result = releaseLock(tmpDir, ".env", "bob");
    expect(result).toBe(false);
  });

  it("lists all locks", () => {
    acquireLock(tmpDir, ".env", "alice");
    acquireLock(tmpDir, ".env.staging", "bob");
    const locks = listLocks(tmpDir);
    expect(locks).toHaveLength(2);
    expect(locks.map((l) => l.file)).toContain(".env");
    expect(locks.map((l) => l.file)).toContain(".env.staging");
  });

  it("returns empty list when no lock file exists", () => {
    expect(listLocks(tmpDir)).toEqual([]);
  });

  it("getLockFilePath returns correct path", () => {
    expect(getLockFilePath("/repo")).toBe("/repo/.env.lock.json");
  });
});
