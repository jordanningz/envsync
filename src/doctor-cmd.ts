import { Command } from "commander";
import { runDoctor, formatDoctorReport } from "./env-doctor";

export function registerDoctorCommands(program: Command): void {
  program
    .command("doctor")
    .description("Check envsync setup health and diagnose common issues")
    .option("--json", "Output results as JSON")
    .action(async (opts: { json?: boolean }) => {
      const cwd = process.cwd();
      try {
        const report = await runDoctor(cwd);

        if (opts.json) {
          process.stdout.write(JSON.stringify(report, null, 2) + "\n");
          if (!report.healthy) process.exit(1);
          return;
        }

        const output = formatDoctorReport(report);
        process.stdout.write(output + "\n");

        if (!report.healthy) {
          process.exit(1);
        }
      } catch (err: any) {
        process.stderr.write(`Error running doctor: ${err.message}\n`);
        process.exit(1);
      }
    });
}
