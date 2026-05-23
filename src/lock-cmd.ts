import { Command } from "commander";
import * as path from "path";
import { acquireLock, releaseLock, getLock, listLocks } from "./env-lock";
import { getCurrentUser } from "./audit-cmd";

function getRepoRoot(): string {
  return process.cwd();
}

export function registerLockCommands(program: Command): void {
  const lock = program.command("lock").description("Manage .env file locks");

  lock
    .command("acquire <file>")
    .description("Lock a .env file for editing")
    .action(async (file: string) => {
      const user = await getCurrentUser();
      const repoRoot = getRepoRoot();
      const success = acquireLock(repoRoot, file, user);
      if (success) {
        console.log(`Locked '${file}' for user '${user}'.`);
      } else {
        const existing = getLock(repoRoot, file);
        console.error(
          `Cannot lock '${file}': already locked by '${existing?.lockedBy}' at ${existing?.lockedAt}`
        );
        process.exitCode = 1;
      }
    });

  lock
    .command("release <file>")
    .description("Release a lock on a .env file")
    .action(async (file: string) => {
      const user = await getCurrentUser();
      const repoRoot = getRepoRoot();
      const success = releaseLock(repoRoot, file, user);
      if (success) {
        console.log(`Released lock on '${file}'.`);
      } else {
        console.error(`No lock on '${file}' owned by '${user}'.`);
        process.exitCode = 1;
      }
    });

  lock
    .command("status [file]")
    .description("Show lock status for a file or all files")
    .action((file?: string) => {
      const repoRoot = getRepoRoot();
      if (file) {
        const entry = getLock(repoRoot, file);
        if (entry) {
          console.log(`'${file}' is locked by '${entry.lockedBy}' since ${entry.lockedAt} (${entry.hostname})`);
        } else {
          console.log(`'${file}' is not locked.`);
        }
      } else {
        const locks = listLocks(repoRoot);
        if (locks.length === 0) {
          console.log("No files are currently locked.");
        } else {
          locks.forEach((l) =>
            console.log(`  ${l.file}  ->  ${l.lockedBy}  (${l.lockedAt})  [${l.hostname}]`)
          );
        }
      }
    });
}
