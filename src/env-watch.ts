import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './store';
import { diffEnvFiles, hasDiff } from './diff';

export interface WatchOptions {
  interval?: number;
  onChange?: (diff: ReturnType<typeof diffEnvFiles>) => void;
  onError?: (err: Error) => void;
}

export interface WatchHandle {
  stop: () => void;
}

export function watchEnvFile(
  filePath: string,
  options: WatchOptions = {}
): WatchHandle {
  const { interval = 1000, onChange, onError } = options;
  let lastContent: string | null = null;

  function readCurrent(): string | null {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  lastContent = readCurrent();

  const timer = setInterval(() => {
    try {
      const current = readCurrent();
      if (current === null || current === lastContent) return;

      const oldVars = lastContent ? parseEnvFile(lastContent) : {};
      const newVars = parseEnvFile(current);
      const diff = diffEnvFiles(oldVars, newVars);

      if (hasDiff(diff)) {
        lastContent = current;
        onChange?.(diff);
      }
    } catch (err) {
      onError?.(err as Error);
    }
  }, interval);

  return {
    stop: () => clearInterval(timer),
  };
}

export function getWatchedPath(filePath: string): string {
  return path.resolve(filePath);
}
