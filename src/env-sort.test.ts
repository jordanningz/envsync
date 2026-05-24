import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { sortEnvFile, sortEnvFileInPlace } from "./env-sort";

describe("sortEnvFile", () => {
  it("sorts keys in ascending order by default", () => {
    const content = "ZEBRA=1\nAPPLE=2\nMIDDLE=3\n";
    const result = sortEnvFile(content);
    expect(result.sorted).toBe("APPLE=2\nMIDDLE=3\nZEBRA=1\n");
    expect(result.changed).toBe(true);
    expect(result.keyCount).toBe(3);
  });

  it("sorts keys in descending order", () => {
    const content = "APPLE=1\nZEBRA=2\nMIDDLE=3\n";
    const result = sortEnvFile(content, { order: "desc" });
    expect(result.sorted).toBe("ZEBRA=2\nMIDDLE=3\nAPPLE=1\n");
    expect(result.changed).toBe(true);
  });

  it("reports unchanged when already sorted", () => {
    const content = "ALPHA=1\nBETA=2\nGAMMA=3\n";
    const result = sortEnvFile(content);
    expect(result.changed).toBe(false);
  });

  it("groups comments with the following key", () => {
    const content = "# db config\nDB_HOST=localhost\nAPI_KEY=secret\n";
    const result = sortEnvFile(content, { groupComments: true });
    expect(result.sorted).toContain("API_KEY=secret");
    expect(result.sorted).toContain("# db config\nDB_HOST=localhost");
    const apiIndex = result.sorted.indexOf("API_KEY");
    const dbIndex = result.sorted.indexOf("DB_HOST");
    expect(apiIndex).toBeLessThan(dbIndex);
  });

  it("ignores empty lines", () => {
    const content = "\nZEBRA=1\n\nAPPLE=2\n\n";
    const result = sortEnvFile(content);
    expect(result.keyCount).toBe(2);
    expect(result.sorted).toBe("APPLE=2\nZEBRA=1\n");
  });

  it("handles values with equals signs", () => {
    const content = "TOKEN=abc=def\nALPHA=xyz\n";
    const result = sortEnvFile(content);
    expect(result.sorted).toContain("TOKEN=abc=def");
  });

  it("handles empty content", () => {
    const result = sortEnvFile("");
    expect(result.keyCount).toBe(0);
    expect(result.changed).toBe(false);
  });
});

describe("sortEnvFileInPlace", () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `env-sort-test-${Date.now()}.env`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("writes sorted content back to file", () => {
    fs.writeFileSync(tmpFile, "ZEBRA=1\nAPPLE=2\n", "utf-8");
    const result = sortEnvFileInPlace(tmpFile);
    expect(result.changed).toBe(true);
    const written = fs.readFileSync(tmpFile, "utf-8");
    expect(written).toBe("APPLE=2\nZEBRA=1\n");
  });

  it("does not rewrite file when already sorted", () => {
    const content = "ALPHA=1\nBETA=2\n";
    fs.writeFileSync(tmpFile, content, "utf-8");
    const statBefore = fs.statSync(tmpFile).mtimeMs;
    sortEnvFileInPlace(tmpFile);
    const statAfter = fs.statSync(tmpFile).mtimeMs;
    expect(statAfter).toBe(statBefore);
  });
});
