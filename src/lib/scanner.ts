import fg from 'fast-glob';
import { ScanError } from '../types/errors.js';

/**
 * Default patterns to always exclude from scanning.
 */
const DEFAULT_IGNORE = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  '__pycache__/**',
  '.venv/**',
  'venv/**',
];

/**
 * Sensitive file patterns excluded by default (REQ-STEER-008).
 */
const SENSITIVE_PATTERNS = [
  '**/*.env*',
  '**/*credential*',
  '**/*secret*',
  '**/*.key',
  '**/*.pem',
];

export interface ScanOptions {
  /** Maximum directory depth (default: 10) */
  depth?: number;
  /** Additional negative patterns to exclude */
  exclude?: string[];
  /** Only return files (default: true) */
  onlyFiles?: boolean;
  /** Working directory (default: process.cwd()) */
  cwd?: string;
}

export interface ScanResult {
  /** All matched file paths (relative to cwd) */
  files: string[];
  /** Total file count */
  count: number;
}

/**
 * Scan a directory using fast-glob with built-in safety defaults.
 *
 * - Excludes node_modules, .git, dist, build by default
 * - Excludes sensitive files (*.env*, *credential*, *secret*) per REQ-STEER-008
 * - Supports depth control and custom exclude patterns
 *
 * @param patterns - Glob patterns to match (default: '**')
 * @param options - Scan configuration
 * @returns Matched file paths and count
 * @throws ScanError if scanning fails
 */
export async function scanDir(
  patterns: string | string[] = '**',
  options: ScanOptions = {},
): Promise<ScanResult> {
  const {
    depth = 10,
    exclude = [],
    onlyFiles = true,
    cwd = process.cwd(),
  } = options;

  const ignore = [
    ...DEFAULT_IGNORE,
    ...SENSITIVE_PATTERNS,
    ...exclude,
  ];

  try {
    const files = await fg.glob(patterns, {
      cwd,
      deep: depth,
      ignore,
      onlyFiles,
      dot: false,
      followSymbolicLinks: false,
    });

    return {
      files: files.sort(),
      count: files.length,
    };
  } catch (err) {
    throw new ScanError(
      cwd,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Synchronous variant of scanDir for simpler use cases.
 */
export function scanDirSync(
  patterns: string | string[] = '**',
  options: ScanOptions = {},
): ScanResult {
  const {
    depth = 10,
    exclude = [],
    onlyFiles = true,
    cwd = process.cwd(),
  } = options;

  const ignore = [
    ...DEFAULT_IGNORE,
    ...SENSITIVE_PATTERNS,
    ...exclude,
  ];

  try {
    const files = fg.globSync(patterns, {
      cwd,
      deep: depth,
      ignore,
      onlyFiles,
      dot: false,
      followSymbolicLinks: false,
    });

    return {
      files: files.sort(),
      count: files.length,
    };
  } catch (err) {
    throw new ScanError(
      cwd,
      err instanceof Error ? err.message : String(err),
    );
  }
}
