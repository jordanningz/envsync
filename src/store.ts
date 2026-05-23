import { encrypt, decrypt } from "./crypto";
import {
  gitNotesAdd,
  gitNotesShow,
  gitNotesPush,
  gitNotesFetch,
} from "./git";

const NOTES_REF = "envsync";

export interface EnvStore {
  version: number;
  updatedAt: string;
  vars: Record<string, string>;
}

export async function saveEnv(
  vars: Record<string, string>,
  passphrase: string,
  remote?: string
): Promise<void> {
  const store: EnvStore = {
    version: 1,
    updatedAt: new Date().toISOString(),
    vars,
  };
  const plaintext = JSON.stringify(store);
  const encrypted = await encrypt(plaintext, passphrase);
  gitNotesAdd(NOTES_REF, encrypted);
  if (remote) {
    gitNotesPush(remote, NOTES_REF);
  }
}

export async function loadEnv(
  passphrase: string,
  remote?: string
): Promise<EnvStore> {
  if (remote) {
    gitNotesFetch(remote, NOTES_REF);
  }
  const encrypted = gitNotesShow(NOTES_REF);
  const plaintext = await decrypt(encrypted, passphrase);
  return JSON.parse(plaintext) as EnvStore;
}

export function formatEnvFile(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n");
}

export function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    vars[key] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  }
  return vars;
}
