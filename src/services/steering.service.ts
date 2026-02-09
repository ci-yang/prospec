import * as path from 'node:path';
import { readConfig, writeConfig, resolveBasePaths } from '../lib/config.js';
import { scanDir } from '../lib/scanner.js';
import { detectModules } from '../lib/module-detector.js';
import type { DetectionResult } from '../lib/module-detector.js';
import { detectTechStack } from '../lib/detector.js';
import { renderTemplate } from '../lib/template.js';
import { atomicWrite, ensureDir } from '../lib/fs-utils.js';
import { stringifyYaml } from '../lib/yaml-utils.js';
import type { ProspecConfig } from '../types/config.js';
import type { ModuleMap } from '../types/module-map.js';

export interface SteeringOptions {
  dryRun?: boolean;
  depth?: number;
  cwd?: string;
}

export interface SteeringResult {
  fileCount: number;
  moduleCount: number;
  architecture: string;
  entryPoints: string[];
  modules: Array<{
    name: string;
    description: string;
    fileCount: number;
    keywords: string[];
    relationships: {
      depends_on: string[];
      used_by: string[];
    };
  }>;
  outputFiles: string[];
  dryRun: boolean;
}

/**
 * Execute the steering workflow:
 *
 * 1. Read config (.prospec.yaml must exist — enforced by preAction hook)
 * 2. Scan project files with fast-glob
 * 3. Detect modules (five-step algorithm)
 * 4. Detect tech stack
 * 5. Generate module-map.yaml
 * 6. Generate architecture.md
 * 7. Update .prospec.yaml (tech_stack + paths)
 */
export async function execute(
  options: SteeringOptions,
): Promise<SteeringResult> {
  const cwd = options.cwd ?? process.cwd();
  const depth = options.depth ?? 10;
  const dryRun = options.dryRun ?? false;

  // 1. Read existing config
  const config = await readConfig(cwd);
  const excludePatterns = config.exclude ?? [];

  // 2. Scan project files
  const scanResult = await scanDir('**', {
    cwd,
    depth,
    exclude: excludePatterns,
  });

  // 3. Detect modules
  const detection: DetectionResult = detectModules(scanResult.files, cwd);

  // 4. Detect tech stack
  const techStack = detectTechStack(cwd);

  // 5. Build module-map data
  const moduleMap: ModuleMap = {
    modules: detection.modules.map((m) => ({
      name: m.name,
      description: m.description,
      paths: m.paths,
      keywords: m.keywords,
      relationships: {
        depends_on: m.relationships.depends_on,
        used_by: m.relationships.used_by,
      },
    })),
  };

  // 6. Build architecture template context
  const { knowledgePath } = resolveBasePaths(config, cwd);
  const knowledgeBasePath = path.relative(cwd, knowledgePath);
  const architectureContext = {
    project_name: config.project.name,
    tech_stack: {
      language: techStack.language,
      framework: techStack.framework,
      package_manager: techStack.package_manager,
    },
    directory_tree: buildDirectoryTree(scanResult.files),
    layers: buildLayers(detection, config),
    entry_points: detection.entryPoints,
    modules: detection.modules.map((m) => ({
      name: m.name,
      description: m.description,
      file_count: countModuleFiles(m.paths, scanResult.files),
      keywords: m.keywords,
      relationships: m.relationships,
    })),
  };

  const outputFiles: string[] = [];

  if (!dryRun) {
    // 7a. Write module-map.yaml
    const moduleMapPath = path.join(cwd, knowledgeBasePath, 'module-map.yaml');
    await ensureDir(path.dirname(moduleMapPath));
    const moduleMapContent = stringifyYaml(moduleMap);
    await atomicWrite(moduleMapPath, moduleMapContent);
    outputFiles.push(path.join(knowledgeBasePath, 'module-map.yaml'));

    // 7b. Write architecture.md
    const architecturePath = path.join(cwd, knowledgeBasePath, 'architecture.md');
    const architectureContent = renderTemplate(
      'steering/architecture.md.hbs',
      architectureContext,
    );
    await atomicWrite(architecturePath, architectureContent);
    outputFiles.push(path.join(knowledgeBasePath, 'architecture.md'));

    // 7c. Update .prospec.yaml (tech_stack + paths)
    const updatedConfig: ProspecConfig = {
      ...config,
      tech_stack: {
        ...config.tech_stack,
        language: techStack.language || config.tech_stack?.language,
        framework: techStack.framework || config.tech_stack?.framework,
        package_manager:
          techStack.package_manager || config.tech_stack?.package_manager,
      },
      paths: buildPathsFromModules(detection),
    };
    await writeConfig(updatedConfig, cwd);
    outputFiles.push('.prospec.yaml');
  }

  return {
    fileCount: scanResult.count,
    moduleCount: detection.modules.length,
    architecture: detection.architecture,
    entryPoints: detection.entryPoints,
    modules: detection.modules.map((m) => ({
      name: m.name,
      description: m.description,
      fileCount: countModuleFiles(m.paths, scanResult.files),
      keywords: m.keywords,
      relationships: m.relationships,
    })),
    outputFiles,
    dryRun,
  };
}

/**
 * Build a simple directory tree representation from file paths.
 */
function buildDirectoryTree(files: string[]): string {
  const dirs = new Set<string>();

  for (const file of files) {
    const parts = file.split('/');
    // Add each directory level
    for (let i = 1; i <= Math.min(parts.length - 1, 3); i++) {
      dirs.add(parts.slice(0, i).join('/') + '/');
    }
  }

  const sorted = [...dirs].sort();
  const lines: string[] = [];

  for (const dir of sorted) {
    const depth = dir.split('/').length - 2;
    const name = dir.split('/').filter(Boolean).pop() ?? '';
    const indent = '  '.repeat(depth);
    lines.push(`${indent}${name}/`);
  }

  return lines.join('\n');
}

/**
 * Build architecture layers from detection results and config.
 */
function buildLayers(
  detection: DetectionResult,
  config: ProspecConfig,
): Array<{ name: string; pattern: string; description: string }> {
  // Use config paths if available
  if (config.paths && Object.keys(config.paths).length > 0) {
    return Object.entries(config.paths).map(([name, pattern]) => ({
      name,
      pattern,
      description: inferLayerDescription(name),
    }));
  }

  // Otherwise derive from detected modules
  return detection.modules
    .filter((m) => m.paths.length > 0)
    .map((m) => ({
      name: m.name,
      pattern: m.paths[0] ?? `${m.name}/**`,
      description: m.description,
    }));
}

/**
 * Infer a layer description from its name.
 */
function inferLayerDescription(name: string): string {
  const descriptions: Record<string, string> = {
    cli: 'Command-line interface entry points',
    commands: 'CLI command definitions',
    services: 'Business logic layer',
    lib: 'Shared utility functions',
    types: 'Type definitions and schemas',
    models: 'Data model definitions',
    routes: 'Route handlers',
    controllers: 'Request controllers',
    middleware: 'Middleware functions',
    views: 'View templates',
    components: 'UI components',
    pages: 'Page components',
    api: 'API endpoint definitions',
    tests: 'Test files',
    domain: 'Domain layer',
    application: 'Application layer',
    infrastructure: 'Infrastructure layer',
  };

  return descriptions[name] ?? `${name} layer`;
}

/**
 * Count files belonging to a module based on its path patterns.
 */
function countModuleFiles(
  modulePaths: string[],
  allFiles: string[],
): number {
  return allFiles.filter((f) =>
    modulePaths.some((p) => {
      const base = p.replace(/\/\*\*$/, '');
      return f.startsWith(base);
    }),
  ).length;
}

/**
 * Build paths config from detected modules.
 */
function buildPathsFromModules(
  detection: DetectionResult,
): Record<string, string> {
  const paths: Record<string, string> = {};
  for (const mod of detection.modules) {
    if (mod.paths.length > 0) {
      paths[mod.name] = mod.paths[0] ?? `${mod.name}/**`;
    }
  }
  return paths;
}
