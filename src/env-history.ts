import { gitNotesList, gitNotesShow } from './git';
import { decrypt } from './crypto';
import { parseEnvFile } from './store';

export interface HistoryEntry {
  commit: string;
  timestamp: string;
  keys: string[];
}

export interface HistorySnapshot {
  commit: string;
  timestamp: string;
  env: Record<string, string>;
}

export async function listHistory(
  namespace: string
): Promise<HistoryEntry[]> {
  const notes = await gitNotesList(namespace);
  const entries: HistoryEntry[] = [];
  for (const { commit, note } of notes) {
    try {
      const parsed = JSON.parse(note);
      entries.push({
        commit,
        timestamp: parsed.timestamp ?? '',
        keys: parsed.keys ?? [],
      });
    } catch {
      // skip malformed notes
    }
  }
  return entries.sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}

export async function getSnapshot(
  commit: string,
  namespace: string,
  key: Buffer
): Promise<HistorySnapshot> {
  const raw = await gitNotesShow(commit, namespace);
  const parsed = JSON.parse(raw);
  const decrypted = await decrypt(parsed.data, key);
  const env = parseEnvFile(decrypted);
  return {
    commit,
    timestamp: parsed.timestamp ?? '',
    env,
  };
}

export function formatHistory(entries: HistoryEntry[]): string {
  if (entries.length === 0) return 'No history found.';
  return entries
    .map(
      (e) =>
        `${e.commit.slice(0, 7)}  ${e.timestamp}  keys: ${e.keys.join(', ') || '(none)'}` 
    )
    .join('\n');
}
