import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseTemplate, generateTemplate, loadTemplate } from "./env-template";

describe("parseTemplate", () => {
  it("parses required keys with empty values", () => {
    const content = "DB_URL=\nAPI_KEY=";
    const entries = parseTemplate(content);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: "DB_URL", required: true });
    expect(entries[1]).toMatchObject({ key: "API_KEY", required: true });
  });

  it("parses optional keys with default values", () => {
    const content = "PORT=3000\nNODE_ENV=development";
    const entries = parseTemplate(content);
    expect(entries[0]).toMatchObject({ key: "PORT", required: false, defaultValue: "3000" });
    expect(entries[1]).toMatchObject({ key: "NODE_ENV", required: false, defaultValue: "development" });
  });

  it("captures description from preceding comment", () => {
    const content = "# Database connection URL\nDB_URL=";
    const entries = parseTemplate(content);
    expect(entries[0].description).toBe("Database connection URL");
  });

  it("ignores blank lines between comment and key", () => {
    const content = "# My key\n\nMY_KEY=value";
    const entries = parseTemplate(content);
    expect(entries[0].description).toBeUndefined();
  });

  it("marks REQUIRED placeholder as required", () => {
    const content = "SECRET=REQUIRED";
    const entries = parseTemplate(content);
    expect(entries[0].required).toBe(true);
    expect(entries[0].defaultValue).toBeUndefined();
  });
});

describe("generateTemplate", () => {
  it("strips values from env content", () => {
    const env = "DB_URL=postgres://localhost/db\nPORT=5432";
    const template = generateTemplate(env);
    expect(template).toContain("DB_URL=");
    expect(template).toContain("PORT=");
    expect(template).not.toContain("postgres");
    expect(template).not.toContain("5432");
  });

  it("preserves comment lines", () => {
    const env = "# App config\nPORT=3000";
    const template = generateTemplate(env);
    expect(template).toContain("# App config");
  });
});

describe("loadTemplate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envsync-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads and parses a template file", () => {
    const filePath = path.join(tmpDir, ".env.template");
    fs.writeFileSync(filePath, "DB_URL=\nPORT=3000");
    const entries = loadTemplate(filePath);
    expect(entries).toHaveLength(2);
  });

  it("throws if file does not exist", () => {
    expect(() => loadTemplate(path.join(tmpDir, "missing.env"))).toThrow("Template file not found");
  });
});
