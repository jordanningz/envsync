import { parseEnvFile, formatEnvFile } from './store';

export interface RenameResult {
  success: boolean;
  oldKey: string;
  newKey: string;
  error?: string;
}

/**
 * Rename a key in an env file's content string.
 * Returns the updated content and a result descriptor.
 */
export function renameEnvKey(
  content: string,
  oldKey: string,
  newKey: string
): { content: string; result: RenameResult } {
  if (!oldKey || !newKey) {
    return {
      content,
      result: { success: false, oldKey, newKey, error: 'Key names must not be empty' },
    };
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(newKey)) {
    return {
      content,
      result: { success: false, oldKey, newKey, error: `Invalid key name: ${newKey}` },
    };
  }

  const entries = parseEnvFile(content);

  if (!Object.prototype.hasOwnProperty.call(entries, oldKey)) {
    return {
      content,
      result: { success: false, oldKey, newKey, error: `Key not found: ${oldKey}` },
    };
  }

  if (Object.prototype.hasOwnProperty.call(entries, newKey)) {
    return {
      content,
      result: { success: false, oldKey, newKey, error: `Key already exists: ${newKey}` },
    };
  }

  // Rebuild preserving order
  const renamed: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    renamed[k === oldKey ? newKey : k] = v;
  }

  return {
    content: formatEnvFile(renamed),
    result: { success: true, oldKey, newKey },
  };
}
