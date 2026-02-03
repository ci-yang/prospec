import * as fs from 'node:fs';
import * as path from 'node:path';
import { WriteError } from '../types/errors.js';

/**
 * Atomic write: writes to a temp file then renames to target path.
 * Ensures no partial writes corrupt the target file.
 */
export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    await fs.promises.writeFile(tmpPath, content, 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new WriteError(
      filePath,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Recursively creates a directory if it doesn't exist.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (err) {
    throw new WriteError(
      dirPath,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Synchronously checks whether a file exists.
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
