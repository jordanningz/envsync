import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { checkEnvAgainstExample, formatCheckResult } from "./env-check";

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `envsync-check-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

afterEach(() => {
  // cleanup handled per-test via individual paths
});

describe("checkEnvAgainstExample", () => {
  it("returns empty arrays when both files are in sync", () => {
    const env = writeTmp("FOO=bar\nBAZ=qux\n");
    const example = writeTmp("FOO=\nBAZ=\n");
    const result = checkEnvAgainstExample(env, example);
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(result.present).toEqual(["FOO", "BAZ"]);
    fs.unlinkSync(env);
    fs.unlinkSync(example);
  });

  it("detects missing keys", () => {
    const env = writeTmp("FOO=bar\n");
    const example = writeTmp("FOO=\nBAZ=\n");
    const result = checkEnvAgainstExample(env, example);
    expect(result.missing).toEqual(["BAZ"]);
    expect(result.extra).toEqual([]);
    fs.unlinkSync(env);
    fs.unlinkSync(example);
  });

  it("detects extra keys", () => {
    const env = writeTmp("FOO=bar\nSECRET=xyz\n");
    const example = writeTmp("FOO=\n");
    const result = checkEnvAgainstExample(env, example);
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual(["SECRET"]);
    fs.unlinkSync(env);
    fs.unlinkSync(example);
  });

  it("ignores comments and blank lines", () => {
    const env = writeTmp("# comment\nFOO=bar\n\n");
    const example = writeTmp("# example comment\nFOO=\n");
    const result = checkEnvAgainstExample(env, example);
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
    fs.unlinkSync(env);
    fs.unlinkSync(example);
  });

  it("returns all as missing when .env does not exist", () => {
    const example = writeTmp("FOO=\nBAR=\n");
    const result = checkEnvAgainstExample("/nonexistent/.env", example);
    expect(result.missing).toEqual(["FOO", "BAR"]);
    expect(result.present).toEqual([]);
    fs.unlinkSync(example);
  });
});

describe("formatCheckResult", () => {
  it("shows success message when in sync", () => {
    const out = formatCheckResult({ missing: [], extra: [], present: ["A", "B"] });
    expect(out).toContain("✅");
    expect(out).toContain("2 key(s) matched");
  });

  it("shows missing and extra keys", () => {
    const out = formatCheckResult({ missing: ["DB_URL"], extra: ["OLD_KEY"], present: [] });
    expect(out).toContain("❌");
    expect(out).toContain("DB_URL");
    expect(out).toContain("⚠️");
    expect(out).toContain("OLD_KEY");
  });
});
