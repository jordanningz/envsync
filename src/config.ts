import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface EnvsyncConfig {
  notesRef: string;
  envFile: string;
  keyFile: string;
}

const DEFAULT_CONFIG: EnvsyncConfig = {
  notesRef: 'refs/notes/envsync',
  envFile: '.env',
  keyFile: path.join(os.homedir(), '.envsync', 'key'),
};

const CONFIG_FILE = '.envsyncrc';

export function loadConfig(cwd: string = process.cwd()): EnvsyncConfig {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    throw new Error(`Failed to parse ${CONFIG_FILE}: ${(err as Error).message}`);
  }
}

export function saveConfig(config: Partial<EnvsyncConfig>, cwd: string = process.cwd()): void {
  const configPath = path.join(cwd, CONFIG_FILE);
  const existing = loadConfig(cwd);
  const merged = { ...existing, ...config };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
}

export function getKeyFilePath(config: EnvsyncConfig): string {
  return config.keyFile;
}

export function ensureKeyDir(config: EnvsyncConfig): void {
  const dir = path.dirname(config.keyFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}
