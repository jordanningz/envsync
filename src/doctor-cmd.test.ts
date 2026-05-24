import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerDoctorCommands } from "./doctor-cmd";
import * as envDoctor from "./env-doctor";

vi.mock("./env-doctor");

const mockRunDoctor = vi.mocked(envDoctor.runDoctor);
const mockFormatDoctorReport = vi.mocked(envDoctor.formatDoctorReport);

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDoctorCommands(program);
  return program;
}

const healthyReport: envDoctor.DoctorReport = {
  healthy: true,
  checks: [
    { name: "initialization", status: "ok", message: "envsync is initialized" },
  ],
};

const unhealthyReport: envDoctor.DoctorReport = {
  healthy: false,
  checks: [
    { name: "initialization", status: "error", message: "not initialized" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRunDoctor.mockResolvedValue(healthyReport);
  mockFormatDoctorReport.mockReturnValue("envsync doctor:\n  ✔ All checks passed.");
});

describe("doctor command", () => {
  it("prints formatted report on success", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await buildProgram().parseAsync(["node", "test", "doctor"]);
    expect(mockRunDoctor).toHaveBeenCalled();
    expect(mockFormatDoctorReport).toHaveBeenCalledWith(healthyReport);
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("All checks passed."));
    writeSpy.mockRestore();
  });

  it("outputs JSON when --json flag is used", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await buildProgram().parseAsync(["node", "test", "doctor", "--json"]);
    const written = (writeSpy.mock.calls[0][0] as string);
    const parsed = JSON.parse(written);
    expect(parsed.healthy).toBe(true);
    writeSpy.mockRestore();
  });

  it("exits with code 1 when report is unhealthy", async () => {
    mockRunDoctor.mockResolvedValue(unhealthyReport);
    mockFormatDoctorReport.mockReturnValue("Some checks failed.");
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    await buildProgram().parseAsync(["node", "test", "doctor"]);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("writes error and exits on exception", async () => {
    mockRunDoctor.mockRejectedValue(new Error("boom"));
    const errSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    await buildProgram().parseAsync(["node", "test", "doctor"]);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
