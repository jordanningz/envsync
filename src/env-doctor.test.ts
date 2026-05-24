import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDoctor, formatDoctorReport } from "./env-doctor";
import * as envInit from "./env-init";
import * as config from "./config";
import * as keystore from "./keystore";
import * as fs from "fs";

vi.mock("./env-init");
vi.mock("./config");
vi.mock("./keystore");
vi.mock("fs");

const mockIsInitialized = vi.mocked(envInit.isInitialized);
const mockLoadConfig = vi.mocked(config.loadConfig);
const mockKeyExists = vi.mocked(keystore.keyExists);
const mockExistsSync = vi.mocked(fs.existsSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);

beforeEach(() => {
  vi.clearAllMocks();
  mockIsInitialized.mockResolvedValue(true);
  mockLoadConfig.mockResolvedValue({ namespace: "myapp" } as any);
  mockKeyExists.mockResolvedValue(true);
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(".env\nnode_modules\n" as any);
});

describe("runDoctor", () => {
  it("returns healthy report when everything is fine", async () => {
    const report = await runDoctor("/fake");
    expect(report.healthy).toBe(true);
    expect(report.checks.every((c) => c.status === "ok")).toBe(true);
  });

  it("reports error when not initialized", async () => {
    mockIsInitialized.mockResolvedValue(false);
    const report = await runDoctor("/fake");
    const check = report.checks.find((c) => c.name === "initialization");
    expect(check?.status).toBe("error");
    expect(report.healthy).toBe(false);
  });

  it("reports error when config cannot be loaded", async () => {
    mockLoadConfig.mockRejectedValue(new Error("missing"));
    const report = await runDoctor("/fake");
    const check = report.checks.find((c) => c.name === "config");
    expect(check?.status).toBe("error");
  });

  it("reports error when encryption key is missing", async () => {
    mockKeyExists.mockResolvedValue(false);
    const report = await runDoctor("/fake");
    const check = report.checks.find((c) => c.name === "encryption-key");
    expect(check?.status).toBe("error");
  });

  it("warns when .env is not gitignored", async () => {
    mockReadFileSync.mockReturnValue("node_modules\n" as any);
    const report = await runDoctor("/fake");
    const check = report.checks.find((c) => c.name === ".env-gitignored");
    expect(check?.status).toBe("warn");
    expect(report.healthy).toBe(true); // warn doesn't break healthy
  });

  it("warns when .env file is absent", async () => {
    mockExistsSync.mockImplementation((p: any) => !String(p).endsWith(".env") || String(p).endsWith(".gitignore"));
    const report = await runDoctor("/fake");
    const check = report.checks.find((c) => c.name === ".env-file");
    expect(check?.status).toBe("warn");
  });
});

describe("formatDoctorReport", () => {
  it("includes check names and messages", async () => {
    const report = await runDoctor("/fake");
    const output = formatDoctorReport(report);
    expect(output).toContain("envsync doctor:");
    expect(output).toContain("initialization");
    expect(output).toContain("All checks passed.");
  });

  it("shows failure summary when unhealthy", async () => {
    mockIsInitialized.mockResolvedValue(false);
    const report = await runDoctor("/fake");
    const output = formatDoctorReport(report);
    expect(output).toContain("Some checks failed");
    expect(output).toContain("✖");
  });
});
