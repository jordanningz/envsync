import { execSync } from "child_process";

export function gitNotesAdd(ref: string, message: string): void {
  execSync(`git notes --ref=${ref} add -f -m ${JSON.stringify(message)}`, {
    stdio: "pipe",
  });
}

export function gitNotesShow(ref: string, commitHash?: string): string {
  const target = commitHash ?? "HEAD";
  const result = execSync(
    `git notes --ref=${ref} show ${target}`,
    { stdio: "pipe" }
  );
  return result.toString().trim();
}

export function gitNotesList(ref: string): string[] {
  try {
    const result = execSync(`git notes --ref=${ref} list`, { stdio: "pipe" });
    return result
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split(" ")[1]);
  } catch {
    return [];
  }
}

export function gitNotesPush(remote: string, ref: string): void {
  execSync(`git push ${remote} refs/notes/${ref}`, { stdio: "pipe" });
}

export function gitNotesFetch(remote: string, ref: string): void {
  execSync(
    `git fetch ${remote} refs/notes/${ref}:refs/notes/${ref}`,
    { stdio: "pipe" }
  );
}

export function getCurrentCommitHash(): string {
  return execSync("git rev-parse HEAD", { stdio: "pipe" })
    .toString()
    .trim();
}
