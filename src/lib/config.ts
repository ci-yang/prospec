import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { ProspecConfigSchema } from '../types/config.js';
import type { ProspecConfig } from '../types/config.js';
import { ConfigNotFound, ConfigInvalid } from '../types/errors.js';
import { atomicWrite } from './fs-utils.js';
import { parseYaml, parseYamlDocument, stringifyYamlDocument } from './yaml-utils.js';

const CONFIG_FILENAME = '.prospec.yaml';

export interface BasePaths {
  baseDir: string;
  knowledgePath: string;
  constitutionPath: string;
  specsPath: string;
}

/**
 * Derive all standard Prospec paths from config.
 *
 * Resolution: paths.base_dir → knowledge.base_path fallback → 'docs' legacy default.
 * Returns absolute paths when cwd is provided.
 */
export function resolveBasePaths(config: ProspecConfig, cwd: string): BasePaths {
  const baseDir = config.paths?.base_dir ?? 'docs';
  const knowledgePath = config.knowledge?.base_path ?? path.join(baseDir, 'ai-knowledge');
  const constitutionPath = path.join(baseDir, 'CONSTITUTION.md');
  const specsPath = path.join(baseDir, 'specs');

  return {
    baseDir: path.resolve(cwd, baseDir),
    knowledgePath: path.resolve(cwd, knowledgePath),
    constitutionPath: path.resolve(cwd, constitutionPath),
    specsPath: path.resolve(cwd, specsPath),
  };
}

/**
 * Resolve the config file path from a given directory (default: cwd).
 */
export function resolveConfigPath(cwd?: string): string {
  return path.resolve(cwd ?? process.cwd(), CONFIG_FILENAME);
}

/**
 * Read and validate .prospec.yaml.
 *
 * - Throws ConfigNotFound if file doesn't exist
 * - Throws ConfigInvalid if schema validation fails (missing project.name)
 * - Warns on unknown fields but does not block (passthrough schema)
 */
export async function readConfig(cwd?: string): Promise<ProspecConfig> {
  const configPath = resolveConfigPath(cwd);

  let raw: string;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch {
    throw new ConfigNotFound(configPath);
  }

  return validateConfig(raw, configPath);
}

/**
 * Validate a raw YAML string as ProspecConfig.
 *
 * Returns the validated config or throws ConfigInvalid.
 */
export function validateConfig(
  rawYaml: string,
  sourcePath?: string,
): ProspecConfig {
  const data = parseYaml(rawYaml, sourcePath);
  const result = ProspecConfigSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue: z.core.$ZodIssue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');
    throw new ConfigInvalid(issues);
  }

  return result.data;
}

/**
 * Write config to .prospec.yaml using atomic write.
 *
 * If the file already exists, uses Document API to preserve comments.
 * Otherwise writes a fresh YAML file.
 */
export async function writeConfig(
  config: ProspecConfig,
  cwd?: string,
): Promise<void> {
  const configPath = resolveConfigPath(cwd);

  let output: string;

  try {
    const existing = await fs.promises.readFile(configPath, 'utf-8');
    // Preserve comments by using Document API
    const doc = parseYamlDocument(existing, configPath);
    // Update document contents with new config values
    doc.contents = doc.createNode(config) as typeof doc.contents;
    output = stringifyYamlDocument(doc);
  } catch {
    // File doesn't exist or can't be read — write fresh
    const { stringify } = await import('yaml');
    output = stringify(config);
  }

  await atomicWrite(configPath, output);
}
