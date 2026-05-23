import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  acquireLock,
  releaseLock,
  getLock,
  listLocks,
  readLockFile,
} from "./env-lock";

describe("env-lock integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envsync-lock-int-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("persists locks across read/write cycles", () => {
    acquireLock(tmpDir, ".env", "alice");
    acquireLock(tmpDir, ".env.staging", "bob");

    const lockFile = readLockFile(tmpDir);
    expect(lockFile.locks).toHaveLength(2);

    releaseLock(tmpDir, ".env", "alice");
    const afterRelease = readLockFile(tmpDir);
    expect(afterRelease.locks).toHaveLength(1);
    expect(afterRelease.locks[0].lockedBy).toBe("bob");
  });

  it("allows re-acquiring after release", () => {
    acquireLock(tmpDir, ".env", "alice");
    releaseLock(tmpDir, ".env", "alice");
    const result = acquireLock(tmpDir, ".env", "bob");
    expect(result).toBe(true);
    expect(getLock(tmpDir, ".env")?.lockedBy).toBe("bob");
  });

  it("multiple files can be locked independently", () => {
    acquireLock(tmpDir, ".env", "alice");
    acquireLock(tmpDir, ".env.production", "alice");
    acquireLock(tmpDir, ".env.staging", "charlie");

    const locks = listLocks(tmpDir);
    expect(locks).toHaveLength(3);

    releaseLock(tmpDir, ".env.production", "alice");
    expect(listLocks(tmpDir)).toHaveLength(2);
    expect(getLock(tmpDir, ".env")).toBeDefined();
    expect(getLock(tmpDir, ".env.staging")).toBeDefined();
  });

  it("lock entry includes hostname and timestamp", () => {
    const before = new Date();
    acquireLock(tmpDir, ".env", "alice");
    const after = new Date();

    const lock = getLock(tmpDir, ".env");
    expect(lock).toBeDefined();
    const lockedAt = new Date(lock!.lockedAt);
    expect(lockedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(lockedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(lock!.hostname).toBeTruthy();
  });
});
