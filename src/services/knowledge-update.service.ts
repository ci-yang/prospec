import * as fs from 'node:fs';
import * as path from 'node:path';
import { readConfig, resolveBasePaths } from '../lib/config.js';
import { scanDir } from '../lib/scanner.js';
import { renderTemplate } from '../lib/template.js';
import { mergeContent } from '../lib/content-merger.js';
import { atomicWrite, ensureDir } from '../lib/fs-utils.js';
import { parseYaml, stringifyYaml } from '../lib/yaml-utils.js';
import type { ModuleMap } from '../types/module-map.js';

// --- Interfaces (Task 5: REQ-SERVICES-023) ---

export interface KnowledgeUpdateOptions {
  /** Path to delta-spec.md (auto mode) */
  deltaSpecPath?: string;
  /** Manual module names to update (manual mode) */
  manualModules?: string[];
  /** Working directory */
  cwd?: string;
}

export interface DeltaReqEntry {
  /** REQ ID (e.g., REQ-SERVICES-020) */
  id: string;
  /** Module name extracted from REQ ID (e.g., services) */
  module: string;
  /** Requirement title/description */
  description: string;
}

export interface DeltaSpecResult {
  added: DeltaReqEntry[];
  modified: DeltaReqEntry[];
  removed: DeltaReqEntry[];
}

export interface GeneratedFile {
  path: string;
  action: 'created' | 'updated' | 'deprecated';
}

export interface KnowledgeUpdateResult {
  /** Modules that were created (ADDED) */
  created: string[];
  /** Modules that were updated (MODIFIED) */
  updated: string[];
  /** Modules that were marked deprecated (REMOVED) */
  deprecated: string[];
  /** All generated/modified file paths */
  generatedFiles: GeneratedFile[];
}

// --- Delta Spec Parser (Task 6: REQ-SERVICES-020) ---

/**
 * Parse delta-spec.md content into structured ADDED/MODIFIED/REMOVED entries.
 *
 * Extracts REQ IDs (REQ-{MODULE}-{NNN}) and maps them to module names.
 * Returns empty arrays for malformed or empty input (never throws).
 */
export function parseDeltaSpec(content: string): DeltaSpecResult {
  const result: DeltaSpecResult = { added: [], modified: [], removed: [] };

  if (!content || !content.trim()) {
    return result;
  }

  const lines = content.split('\n');
  let currentSection: 'added' | 'modified' | 'removed' | null = null;

  for (const line of lines) {
    // Detect section headers
    const sectionMatch = line.match(/^##\s+(ADDED|MODIFIED|REMOVED)/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1]!.toLowerCase() as 'added' | 'modified' | 'removed';
      continue;
    }

    // Detect REQ ID headers: ### REQ-{MODULE}-{NNN}: Description
    const reqMatch = line.match(/^###\s+(REQ-([\w-]+)-\d{3}):\s*(.*)/);
    if (reqMatch && currentSection) {
      result[currentSection].push({
        id: reqMatch[1]!,
        module: reqMatch[2]!.toLowerCase(),
        description: reqMatch[3]!.trim(),
      });
    }
  }

  return result;
}

// --- Module Identification (Task 7: REQ-SERVICES-020) ---

/**
 * Map delta-spec module names to module-map.yaml entries.
 *
 * Returns unique module names. If module-map.yaml doesn't exist,
 * returns the raw module names from delta-spec.
 */
export function identifyAffectedModules(
  deltaResult: DeltaSpecResult,
  moduleMapPath: string,
): string[] {
  // Collect unique module names from all sections
  const allEntries = [
    ...deltaResult.added,
    ...deltaResult.modified,
    ...deltaResult.removed,
  ];
  const rawModules = [...new Set(allEntries.map((e) => e.module))];

  // Try to read module-map.yaml for validation
  let moduleMap: ModuleMap | null = null;
  try {
    const content = fs.readFileSync(moduleMapPath, 'utf-8');
    moduleMap = parseYaml<ModuleMap>(content, moduleMapPath);
  } catch {
    // module-map.yaml doesn't exist or is invalid — use raw names
    return rawModules;
  }

  // Map raw names to actual module-map entries (case-insensitive match)
  return rawModules.map((name) => {
    // Find exact or case-insensitive match
    const match = moduleMap!.modules.find(
      (m) => m.name.toLowerCase() === name,
    );
    return match ? match.name : name;
  });
}

// --- Module README Update (Task 8: REQ-SERVICES-021) ---

/**
 * Scan module source and update its README.md.
 *
 * For new modules: creates directory and README.md.
 * For existing modules: merges auto sections, preserves user sections.
 */
export async function updateModuleReadme(
  moduleName: string,
  modulePaths: string[],
  options: { cwd: string; knowledgeBasePath: string; excludePatterns?: string[] },
): Promise<GeneratedFile> {
  const readmePath = path.join(
    options.cwd,
    options.knowledgeBasePath,
    'modules',
    moduleName,
    'README.md',
  );

  await ensureDir(path.dirname(readmePath));

  // Scan module files
  const patterns = modulePaths.length > 0 ? modulePaths : [`${moduleName}/**`];
  const scanResult = await scanDir(patterns, {
    cwd: options.cwd,
    exclude: options.excludePatterns ?? [],
  });

  const keyFiles = scanResult.files.slice(0, 20).map((filePath) => ({
    path: filePath,
    description: inferFileDescription(filePath),
  }));

  // Render fresh README content
  const templateContext = {
    module_name: moduleName,
    description: `${moduleName} module`,
    path: modulePaths[0] ?? moduleName,
    keywords: [],
    relationships: { depends_on: [], used_by: [] },
    key_files: keyFiles,
    public_api: [],
  };

  const newContent = renderTemplate('steering/module-readme.hbs', templateContext);

  // Check for existing content to merge
  let existingContent = '';
  let action: GeneratedFile['action'] = 'created';
  try {
    existingContent = await fs.promises.readFile(readmePath, 'utf-8');
    action = 'updated';
  } catch {
    // File doesn't exist — will create
  }

  const finalContent = existingContent
    ? mergeContent(newContent, existingContent)
    : newContent;

  await atomicWrite(readmePath, finalContent);

  return {
    path: path.join(options.knowledgeBasePath, 'modules', moduleName, 'README.md'),
    action,
  };
}

// --- Mark Module Deprecated (Task 9: REQ-SERVICES-021) ---

/**
 * Add a deprecation banner to a module's README.md.
 * Does NOT delete the file — only marks as deprecated.
 */
export async function markModuleDeprecated(
  moduleName: string,
  reason: string,
  options: { cwd: string; knowledgeBasePath: string },
): Promise<GeneratedFile | null> {
  const readmePath = path.join(
    options.cwd,
    options.knowledgeBasePath,
    'modules',
    moduleName,
    'README.md',
  );

  // If README doesn't exist, nothing to deprecate
  try {
    await fs.promises.access(readmePath);
  } catch {
    return null;
  }

  const content = await fs.promises.readFile(readmePath, 'utf-8');

  // Don't add duplicate deprecation banners
  if (content.includes('> **DEPRECATED**')) {
    return { path: path.join(options.knowledgeBasePath, 'modules', moduleName, 'README.md'), action: 'deprecated' };
  }

  const banner = `> **DEPRECATED**: This module was removed. Reason: ${reason}\n\n`;
  const updatedContent = banner + content;

  await atomicWrite(readmePath, updatedContent);

  return {
    path: path.join(options.knowledgeBasePath, 'modules', moduleName, 'README.md'),
    action: 'deprecated',
  };
}

// --- Index Update (Task 10: REQ-SERVICES-022) ---

/**
 * Update _index.md module table within prospec:auto-start/end markers.
 */
export async function updateIndex(
  modules: Array<{ name: string; description: string; status: string }>,
  options: { cwd: string; knowledgeBasePath: string; projectName: string },
): Promise<GeneratedFile> {
  const indexPath = path.join(options.cwd, options.knowledgeBasePath, '_index.md');
  await ensureDir(path.dirname(indexPath));

  // Build new auto section content
  const tableRows = modules
    .map((m) => `| ${m.name} | — | ${m.status} | ${m.description} | README | — |`)
    .join('\n');

  const autoContent = `<!-- prospec:auto-start -->
## Modules

| Module | Keywords | Status | Description | Files | Depends On |
|--------|----------|--------|-------------|-------|------------|
${tableRows}

## Project Info

- **Project**: ${options.projectName}
- **Knowledge Base**: \`${options.knowledgeBasePath}\`
<!-- prospec:auto-end -->`;

  // Read existing _index.md for merge
  let existingContent = '';
  let action: GeneratedFile['action'] = 'created';
  try {
    existingContent = await fs.promises.readFile(indexPath, 'utf-8');
    action = 'updated';
  } catch {
    // File doesn't exist — will create full index
  }

  let finalContent: string;
  if (existingContent) {
    finalContent = mergeContent(autoContent + '\n\n<!-- prospec:user-start -->\n<!-- prospec:user-end -->', existingContent);
  } else {
    finalContent = `# AI Knowledge Index

> This file is the entry point for AI assistants.

${autoContent}

<!-- prospec:user-start -->
<!-- Add custom project notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
`;
  }

  await atomicWrite(indexPath, finalContent);

  return {
    path: path.join(options.knowledgeBasePath, '_index.md'),
    action,
  };
}

// --- Module Map Update (Task 11: REQ-SERVICES-022) ---

/**
 * Update module-map.yaml: add new modules, remove deprecated ones.
 * Gracefully skips if module-map.yaml doesn't exist.
 */
export async function updateModuleMap(
  changes: { added: string[]; removed: string[] },
  moduleMapPath: string,
): Promise<GeneratedFile | null> {
  // Graceful skip if module-map.yaml doesn't exist
  try {
    await fs.promises.access(moduleMapPath);
  } catch {
    return null;
  }

  const content = await fs.promises.readFile(moduleMapPath, 'utf-8');
  const moduleMap = parseYaml<ModuleMap>(content, moduleMapPath);

  // Add new modules
  for (const name of changes.added) {
    const exists = moduleMap.modules.some(
      (m) => m.name.toLowerCase() === name.toLowerCase(),
    );
    if (!exists) {
      moduleMap.modules.push({
        name,
        description: `${name} module`,
        paths: [`src/${name}/**`],
        keywords: [name],
      });
    }
  }

  // Remove deprecated modules
  if (changes.removed.length > 0) {
    const removedSet = new Set(changes.removed.map((n) => n.toLowerCase()));
    moduleMap.modules = moduleMap.modules.filter(
      (m) => !removedSet.has(m.name.toLowerCase()),
    );
  }

  await atomicWrite(moduleMapPath, stringifyYaml(moduleMap));

  return {
    path: moduleMapPath,
    action: 'updated',
  };
}

// --- Execute Orchestrator (Task 12: REQ-SERVICES-023) ---

/**
 * Main knowledge-update execution flow.
 *
 * Supports two modes:
 * 1. deltaSpecPath: reads and parses delta-spec.md, identifies affected modules
 * 2. manualModules: accepts module name array, updates only those modules' READMEs
 */
export async function execute(
  options: KnowledgeUpdateOptions,
): Promise<KnowledgeUpdateResult> {
  const cwd = options.cwd ?? process.cwd();

  // Read config
  const config = await readConfig(cwd);
  const { knowledgePath } = resolveBasePaths(config, cwd);
  const knowledgeBasePath = path.relative(cwd, knowledgePath);
  const excludePatterns = config.exclude ?? [];
  const projectName = config.project.name;
  const moduleMapPath = path.join(knowledgePath, 'module-map.yaml');

  const result: KnowledgeUpdateResult = {
    created: [],
    updated: [],
    deprecated: [],
    generatedFiles: [],
  };

  const baseOpts = { cwd, knowledgeBasePath, excludePatterns };

  if (options.deltaSpecPath) {
    // --- Delta Spec Mode ---
    const deltaContent = await fs.promises.readFile(options.deltaSpecPath, 'utf-8');
    const delta = parseDeltaSpec(deltaContent);

    // Resolve module paths from module-map.yaml
    const modulePathMap = buildModulePathMap(moduleMapPath);

    // Process ADDED modules
    for (const entry of delta.added) {
      const paths = modulePathMap.get(entry.module) ?? [`src/${entry.module}/**`];
      const file = await updateModuleReadme(entry.module, paths, baseOpts);
      result.generatedFiles.push(file);
      if (file.action === 'created') {
        result.created.push(entry.module);
      } else {
        result.updated.push(entry.module);
      }
    }

    // Process MODIFIED modules
    for (const entry of delta.modified) {
      const paths = modulePathMap.get(entry.module) ?? [`src/${entry.module}/**`];
      const file = await updateModuleReadme(entry.module, paths, baseOpts);
      result.generatedFiles.push(file);
      if (!result.updated.includes(entry.module) && !result.created.includes(entry.module)) {
        result.updated.push(entry.module);
      }
    }

    // Process REMOVED modules
    for (const entry of delta.removed) {
      const file = await markModuleDeprecated(
        entry.module,
        entry.description,
        { cwd, knowledgeBasePath },
      );
      if (file) {
        result.generatedFiles.push(file);
        result.deprecated.push(entry.module);
      }
    }

    // Update module-map.yaml
    const uniqueAdded = [...new Set(delta.added.map((e) => e.module))];
    const uniqueRemoved = [...new Set(delta.removed.map((e) => e.module))];
    if (uniqueAdded.length > 0 || uniqueRemoved.length > 0) {
      const mapFile = await updateModuleMap(
        { added: uniqueAdded, removed: uniqueRemoved },
        moduleMapPath,
      );
      if (mapFile) {
        result.generatedFiles.push(mapFile);
      }
    }
  } else if (options.manualModules && options.manualModules.length > 0) {
    // --- Manual Mode ---
    const modulePathMap = buildModulePathMap(moduleMapPath);

    for (const moduleName of options.manualModules) {
      const paths = modulePathMap.get(moduleName.toLowerCase()) ?? [`src/${moduleName}/**`];
      const file = await updateModuleReadme(moduleName, paths, baseOpts);
      result.generatedFiles.push(file);
      if (file.action === 'created') {
        result.created.push(moduleName);
      } else {
        result.updated.push(moduleName);
      }
    }
  }

  // Update _index.md with all known modules
  const allModules = collectAllModules(result, moduleMapPath);
  if (allModules.length > 0) {
    const indexFile = await updateIndex(allModules, {
      cwd,
      knowledgeBasePath,
      projectName,
    });
    result.generatedFiles.push(indexFile);
  }

  return result;
}

// --- Internal helpers ---

function buildModulePathMap(moduleMapPath: string): Map<string, string[]> {
  const pathMap = new Map<string, string[]>();
  try {
    const content = fs.readFileSync(moduleMapPath, 'utf-8');
    const moduleMap = parseYaml<ModuleMap>(content, moduleMapPath);
    for (const entry of moduleMap.modules) {
      pathMap.set(entry.name.toLowerCase(), entry.paths);
    }
  } catch {
    // module-map.yaml doesn't exist — return empty map
  }
  return pathMap;
}

function collectAllModules(
  result: KnowledgeUpdateResult,
  moduleMapPath: string,
): Array<{ name: string; description: string; status: string }> {
  const modules: Array<{ name: string; description: string; status: string }> = [];

  // Try reading existing module-map for known modules
  try {
    const content = fs.readFileSync(moduleMapPath, 'utf-8');
    const moduleMap = parseYaml<ModuleMap>(content, moduleMapPath);
    for (const entry of moduleMap.modules) {
      const isDeprecated = result.deprecated.includes(entry.name);
      modules.push({
        name: entry.name,
        description: entry.description ?? `${entry.name} module`,
        status: isDeprecated ? 'Deprecated' : 'Active',
      });
    }
  } catch {
    // Fallback: use result data only
    for (const name of [...result.created, ...result.updated]) {
      modules.push({ name, description: `${name} module`, status: 'Active' });
    }
    for (const name of result.deprecated) {
      modules.push({ name, description: `${name} module`, status: 'Deprecated' });
    }
  }

  return modules;
}

function inferFileDescription(filePath: string): string {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath);

  if (basename === 'index.ts' || basename === 'index.js') return 'Module entry point';
  if (basename.endsWith('.test.ts') || basename.endsWith('.spec.ts')) return 'Test file';
  if (basename.endsWith('.service.ts')) return 'Service implementation';
  if (basename.endsWith('.controller.ts')) return 'Controller implementation';
  if (basename.endsWith('.types.ts')) return 'Type definitions';
  if (basename.endsWith('.utils.ts')) return 'Utility functions';
  if (basename.endsWith('.hbs')) return 'Handlebars template';

  const extDescriptions: Record<string, string> = {
    '.ts': 'TypeScript source',
    '.js': 'JavaScript source',
    '.md': 'Documentation',
    '.yaml': 'YAML configuration',
    '.yml': 'YAML configuration',
    '.json': 'JSON configuration',
  };

  return extDescriptions[ext] ?? 'Source file';
}
