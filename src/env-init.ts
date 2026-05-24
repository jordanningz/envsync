import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig } from './config';
import { generateKey, keyExists } from './keystore';
import { appendAuditEntry } from './audit';

export interface InitOptions {
  force?: boolean;
  notesRef?: string;
}

export interface InitResult {
  configCreated: boolean;
  keyCreated: boolean;
  alreadyInitialized: boolean;
}

export async function initEnvSync(
  repoPath: string,
  options: InitOptions = {}
): Promise<InitResult> {
  const configPath = path.join(repoPath, '.envsync.json');
  const alreadyInitialized = fs.existsSync(configPath) && keyExists(repoPath);

  if (alreadyInitialized && !options.force) {
    return { configCreated: false, keyCreated: false, alreadyInitialized: true };
  }

  const notesRef = options.notesRef ?? 'refs/notes/envsync';
  const config = loadConfig(repoPath) ?? {
    notesRef,
    envFile: '.env',
    version: 1,
  };

  config.notesRef = notesRef;
  saveConfig(repoPath, config);

  let keyCreated = false;
  if (!keyExists(repoPath) || options.force) {
    await generateKey(repoPath);
    keyCreated = true;
  }

  await appendAuditEntry(repoPath, {
    action: 'init',
    user: process.env.USER ?? 'unknown',
    timestamp: new Date().toISOString(),
    details: { notesRef, force: options.force ?? false },
  });

  return { configCreated: true, keyCreated, alreadyInitialized: false };
}

export function isInitialized(repoPath: string): boolean {
  const configPath = path.join(repoPath, '.envsync.json');
  return fs.existsSync(configPath) && keyExists(repoPath);
}
