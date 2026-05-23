import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { generateTemplate, loadTemplate } from "./env-template";

export function registerTemplateCommands(program: Command): void {
  const template = program
    .command("template")
    .description("Manage .env template files");

  template
    .command("generate")
    .description("Generate a .env.template from an existing .env file")
    .argument("[envFile]", "Path to .env file", ".env")
    .option("-o, --output <file>", "Output template file", ".env.template")
    .action((envFile: string, options: { output: string }) => {
      const envPath = path.resolve(envFile);
      if (!fs.existsSync(envPath)) {
        console.error(`Error: File not found: ${envPath}`);
        process.exit(1);
      }
      const content = fs.readFileSync(envPath, "utf-8");
      const templateContent = generateTemplate(content);
      const outPath = path.resolve(options.output);
      fs.writeFileSync(outPath, templateContent, "utf-8");
      console.log(`Template written to ${outPath}`);
    });

  template
    .command("check")
    .description("Check a .env file against a template for missing keys")
    .argument("[templateFile]", "Path to template file", ".env.template")
    .option("-e, --env <file>", "Path to .env file to check", ".env")
    .action((templateFile: string, options: { env: string }) => {
      let entries;
      try {
        entries = loadTemplate(templateFile);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }

      const envPath = path.resolve(options.env);
      const envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf-8")
        : "";

      const envKeys = new Set(
        envContent
          .split("\n")
          .filter((l) => l.includes("=") && !l.startsWith("#"))
          .map((l) => l.split("=")[0].trim())
      );

      const missing = entries.filter((e) => e.required && !envKeys.has(e.key));

      if (missing.length === 0) {
        console.log("All required keys are present.");
      } else {
        console.error(`Missing required keys:`);
        for (const entry of missing) {
          const desc = entry.description ? ` — ${entry.description}` : "";
          console.error(`  ${entry.key}${desc}`);
        }
        process.exit(1);
      }
    });
}
