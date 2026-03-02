import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ModuleMap } from '../types/module-map.js';
import type { KnowledgeStrategy } from '../types/config.js';
import { ModuleDetectionError } from '../types/errors.js';
import { parseYaml } from './yaml-utils.js';

/**
 * Known architecture patterns and their typical directory structures.
 */
const ARCHITECTURE_PATTERNS: Record<string, string[]> = {
  // MVC
  mvc: ['models', 'views', 'controllers'],
  // Three-layer / Layered
  layered: ['routes', 'services', 'models'],
  // Clean Architecture
  clean: ['domain', 'application', 'infrastructure'],
  // Feature-based
  feature: ['features', 'modules'],
  // Pragmatic Layered (Prospec-style)
  pragmatic: ['cli', 'services', 'lib', 'types'],
};

/**
 * Common directory names that typically represent modules.
 */
const MODULE_INDICATORS = [
  'src',
  'lib',
  'app',
  'packages',
  'modules',
  'features',
  'components',
  'pages',
  'routes',
  'services',
  'models',
  'controllers',
  'views',
  'domain',
  'application',
  'infrastructure',
  'api',
  'core',
  'shared',
  'utils',
  'helpers',
  'types',
  'config',
  'middleware',
  'plugins',
  'cli',
  'commands',
];

export interface DetectedModule {
  name: string;
  description: string;
  paths: string[];
  keywords: string[];
  relationships: {
    depends_on: string[];
    used_by: string[];
  };
}

export interface DetectionResult {
  modules: DetectedModule[];
  architecture: string;
  entryPoints: string[];
}

/**
 * Module detection algorithm with configurable strategy:
 *
 * 1. module-map.yaml priority (if exists)
 * 2. Strategy-based detection:
 *    - architecture: Directory name matching (original behavior)
 *    - domain: Business domain grouping (routes/controllers/components → domain modules)
 *    - package: Workspace package detection (monorepos)
 *    - auto: Try package → domain → architecture, pick best fit
 * 3. Architecture pattern recognition
 * 4. Keyword generation
 * 5. Conflict resolution (merge scattered related files)
 *
 * @param files - List of file paths (relative to project root)
 * @param cwd - Project root directory
 * @param strategy - Module partitioning strategy (default: 'auto')
 * @returns Detected modules with relationships
 */
export function detectModules(
  files: string[],
  cwd: string = process.cwd(),
  strategy: KnowledgeStrategy = 'auto',
): DetectionResult {
  try {
    // Step 1: Check for existing module-map.yaml
    const existing = loadExistingModuleMap(cwd);
    if (existing) {
      return {
        modules: existing.modules.map((m) => ({
          name: m.name,
          description: m.description ?? '',
          paths: m.paths,
          keywords: m.keywords,
          relationships: {
            depends_on: m.relationships?.depends_on ?? [],
            used_by: m.relationships?.used_by ?? [],
          },
        })),
        architecture: detectArchitecturePattern(files),
        entryPoints: detectEntryPoints(files),
      };
    }

    // Step 2: Strategy-based detection
    const dirModules = detectByStrategy(files, cwd, strategy);

    // Step 3: Architecture pattern recognition
    const architecture = detectArchitecturePattern(files);

    // Step 4: Keyword generation
    const modulesWithKeywords = dirModules.map((m) => ({
      ...m,
      keywords: generateKeywords(m.name, m.paths),
    }));

    // Step 5: Conflict resolution
    const resolvedModules = resolveConflicts(modulesWithKeywords);

    // Detect relationships
    const modulesWithRelationships = detectRelationships(resolvedModules, files, cwd);

    return {
      modules: modulesWithRelationships,
      architecture,
      entryPoints: detectEntryPoints(files),
    };
  } catch (err) {
    if (err instanceof ModuleDetectionError) throw err;
    throw new ModuleDetectionError(
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Dispatch to the appropriate detection function based on strategy.
 * For 'auto', tries package → domain → architecture and picks the result
 * with the most meaningful module count (>= 2 modules).
 */
function detectByStrategy(
  files: string[],
  cwd: string,
  strategy: KnowledgeStrategy,
): DetectedModule[] {
  switch (strategy) {
    case 'architecture':
      return detectFromDirectories(files);
    case 'domain':
      return detectByDomain(files);
    case 'package':
      return detectByPackage(files, cwd);
    case 'auto':
    default: {
      // Try package first (monorepo indicator)
      const packageModules = detectByPackage(files, cwd);
      if (packageModules.length >= 2) return packageModules;

      // Try domain (app-style projects)
      const domainModules = detectByDomain(files);
      if (domainModules.length >= 2) return domainModules;

      // Fallback to architecture (always works)
      return detectFromDirectories(files);
    }
  }
}

/**
 * Step 1: Load existing module-map.yaml if it exists.
 */
function loadExistingModuleMap(cwd: string): ModuleMap | null {
  const mapPath = path.join(cwd, 'docs', 'ai-knowledge', 'module-map.yaml');
  try {
    const content = fs.readFileSync(mapPath, 'utf-8');
    return parseYaml(content, mapPath) as ModuleMap;
  } catch {
    return null;
  }
}

/**
 * Domain-based detection: group files by inferred business domain.
 *
 * Strategy: extract domain names from file paths by looking for domain-specific
 * directories (e.g., src/features/auth/, src/components/checkout/, routes/orders/).
 * Files that share a domain name across different architectural layers are merged
 * into one domain module.
 */
function detectByDomain(files: string[]): DetectedModule[] {
  const domainFiles = new Map<string, string[]>();

  // Directories that indicate domain-level grouping
  const domainParents = new Set([
    'features', 'modules', 'domains', 'pages', 'routes',
    'views', 'screens', 'components', 'controllers', 'services',
  ]);

  for (const file of files) {
    const parts = file.split('/');
    if (parts.length < 3) continue;

    // Look for pattern: {any}/{domainParent}/{domainName}/...
    // or: src/{domainParent}/{domainName}/...
    let domainName: string | null = null;
    for (let i = 0; i < parts.length - 1; i++) {
      if (domainParents.has(parts[i]!) && parts[i + 1]) {
        domainName = parts[i + 1]!;
        break;
      }
    }

    if (!domainName) continue;

    // Normalize domain name (lowercase, strip common suffixes)
    const normalized = domainName.toLowerCase().replace(/[-_]?(page|view|screen|controller|service|route)s?$/i, '');
    if (normalized.length < 2) continue;

    if (!domainFiles.has(normalized)) {
      domainFiles.set(normalized, []);
    }
    domainFiles.get(normalized)!.push(file);
  }

  // Only keep domains with 2+ files
  const modules: DetectedModule[] = [];
  for (const [name, paths] of domainFiles) {
    if (paths.length >= 2) {
      modules.push({
        name,
        description: `${name} domain`,
        paths: [`**/${name}/**`],
        keywords: [],
        relationships: { depends_on: [], used_by: [] },
      });
    }
  }

  // Add an "infra" catch-all for architectural files not in any domain
  // (middleware, config, utils, etc.)
  const domainPaths = new Set(modules.flatMap((m) => domainFiles.get(m.name) ?? []));
  const infraFiles = files.filter((f) => !domainPaths.has(f) && f.split('/').length >= 2);
  if (infraFiles.length >= 2 && modules.length >= 1) {
    modules.push({
      name: 'infra',
      description: 'Infrastructure and shared utilities',
      paths: [],
      keywords: [],
      relationships: { depends_on: [], used_by: [] },
    });
  }

  return modules;
}

/**
 * Package-based detection for monorepos.
 *
 * Detects workspace packages by looking for:
 * 1. pnpm-workspace.yaml
 * 2. turbo.json
 * 3. package.json with "workspaces" field
 * 4. Fallback: directories under packages/ or apps/ that contain package.json
 */
function detectByPackage(files: string[], cwd: string): DetectedModule[] {
  const packageDirs = new Set<string>();

  // Check for workspace config files
  const workspacePatterns = detectWorkspacePackages(cwd);
  if (workspacePatterns.length > 0) {
    // Match files against workspace patterns
    for (const file of files) {
      for (const pattern of workspacePatterns) {
        const base = pattern.replace(/\/?\*$/, '');
        if (file.startsWith(base + '/')) {
          const parts = file.slice(base.length + 1).split('/');
          if (parts[0]) {
            packageDirs.add(`${base}/${parts[0]}`);
          }
        }
      }
    }
  }

  // Fallback: look for packages/ or apps/ directories
  if (packageDirs.size === 0) {
    for (const file of files) {
      const parts = file.split('/');
      if (parts.length >= 3 && ['packages', 'apps'].includes(parts[0]!)) {
        packageDirs.add(`${parts[0]}/${parts[1]}`);
      }
    }
  }

  if (packageDirs.size === 0) return [];

  const modules: DetectedModule[] = [];
  for (const pkgDir of packageDirs) {
    const name = pkgDir.split('/').pop() ?? pkgDir;
    const pkgFiles = files.filter((f) => f.startsWith(pkgDir + '/'));
    if (pkgFiles.length >= 2) {
      modules.push({
        name,
        description: `${name} package`,
        paths: [`${pkgDir}/**`],
        keywords: [],
        relationships: { depends_on: [], used_by: [] },
      });
    }
  }

  return modules;
}

/**
 * Detect workspace package patterns from config files.
 */
function detectWorkspacePackages(cwd: string): string[] {
  // Try pnpm-workspace.yaml
  try {
    const content = fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf-8');
    const parsed = parseYaml<{ packages?: string[] }>(content, 'pnpm-workspace.yaml');
    if (parsed.packages) return parsed.packages;
  } catch { /* not found */ }

  // Try package.json workspaces
  try {
    const content = fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8');
    const parsed = JSON.parse(content) as { workspaces?: string[] | { packages?: string[] } };
    if (Array.isArray(parsed.workspaces)) return parsed.workspaces;
    if (parsed.workspaces?.packages) return parsed.workspaces.packages;
  } catch { /* not found */ }

  return [];
}

/**
 * Architecture-layer detection: group files by top-level or second-level directory.
 */
function detectFromDirectories(files: string[]): DetectedModule[] {
  const dirMap = new Map<string, string[]>();

  for (const file of files) {
    const parts = file.split('/');
    // Skip root-level files
    if (parts.length < 2) continue;

    // Use second-level dir if first is 'src', 'app', 'lib', 'packages'
    const topDir = parts[0]!;
    let moduleName: string;

    if (['src', 'app', 'lib', 'packages'].includes(topDir) && parts.length >= 3) {
      moduleName = parts[1]!;
    } else {
      moduleName = topDir;
    }

    // Only consider known module indicators or directories with enough files
    if (!dirMap.has(moduleName)) {
      dirMap.set(moduleName, []);
    }
    dirMap.get(moduleName)!.push(file);
  }

  // Filter: only directories with 2+ files or known module names
  const modules: DetectedModule[] = [];
  for (const [name, paths] of dirMap) {
    if (paths.length >= 2 || MODULE_INDICATORS.includes(name)) {
      modules.push({
        name,
        description: inferDescription(name),
        paths: [`${inferBasePath(paths)}/**`],
        keywords: [],
        relationships: { depends_on: [], used_by: [] },
      });
    }
  }

  return modules;
}

/**
 * Step 3: Detect architecture pattern from file structure.
 */
function detectArchitecturePattern(files: string[]): string {
  const topDirs = new Set<string>();

  for (const file of files) {
    const parts = file.split('/');
    if (parts.length >= 2) {
      const dir = ['src', 'app', 'lib'].includes(parts[0]!) && parts.length >= 3
        ? parts[1]!
        : parts[0]!;
      topDirs.add(dir.toLowerCase());
    }
  }

  let bestMatch = 'unknown';
  let bestScore = 0;

  for (const [pattern, indicators] of Object.entries(ARCHITECTURE_PATTERNS)) {
    const score = indicators.filter((ind) => topDirs.has(ind)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  // Require at least 2 matching indicators
  return bestScore >= 2 ? bestMatch : 'unknown';
}

/**
 * Step 4: Generate keywords for a module based on its name and file paths.
 */
function generateKeywords(name: string, paths: string[]): string[] {
  const keywords = new Set<string>();

  // Module name and its parts
  keywords.add(name.toLowerCase());

  // Split camelCase or kebab-case
  const parts = name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[-_]/);

  for (const part of parts) {
    if (part.length >= 3) {
      keywords.add(part);
    }
  }

  // Extract unique directory names from paths
  for (const p of paths) {
    const segments = p.split('/').filter((s) => s !== '**' && s !== '*');
    for (const seg of segments) {
      if (seg.length >= 3 && !seg.includes('.')) {
        keywords.add(seg.toLowerCase());
      }
    }
  }

  return [...keywords];
}

/**
 * Step 5: Resolve conflicts — merge modules that share paths or names.
 */
function resolveConflicts(modules: DetectedModule[]): DetectedModule[] {
  const merged = new Map<string, DetectedModule>();

  for (const mod of modules) {
    const existing = merged.get(mod.name);
    if (existing) {
      // Merge paths and keywords
      existing.paths = [...new Set([...existing.paths, ...mod.paths])];
      existing.keywords = [...new Set([...existing.keywords, ...mod.keywords])];
    } else {
      merged.set(mod.name, { ...mod });
    }
  }

  return [...merged.values()];
}

/**
 * Detect import relationships between modules by scanning file contents.
 */
function detectRelationships(
  modules: DetectedModule[],
  files: string[],
  cwd: string,
): DetectedModule[] {
  // Build module → files mapping
  const moduleFiles = new Map<string, string[]>();
  for (const mod of modules) {
    const modFiles = files.filter((f) =>
      mod.paths.some((p) => {
        const base = p.replace(/\/\*\*$/, '');
        return f.startsWith(base);
      }),
    );
    moduleFiles.set(mod.name, modFiles);
  }

  // Scan imports to detect depends_on
  for (const mod of modules) {
    const ownFiles = moduleFiles.get(mod.name) ?? [];
    const imports = new Set<string>();

    for (const file of ownFiles.slice(0, 20)) {
      // Limit files scanned for performance
      try {
        const content = fs.readFileSync(path.join(cwd, file), 'utf-8');
        // Match TypeScript/JavaScript imports
        const importMatches = content.matchAll(
          /(?:import|from)\s+['"]([^'"]+)['"]/g,
        );
        for (const match of importMatches) {
          if (match[1]) imports.add(match[1]);
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Check if imports reference other modules
    for (const otherMod of modules) {
      if (otherMod.name === mod.name) continue;
      const otherPaths = moduleFiles.get(otherMod.name) ?? [];
      const references = [...imports].some((imp) =>
        otherPaths.some((f) => imp.includes(otherMod.name) || f.includes(imp.replace(/^\.\//, ''))),
      );
      if (references) {
        mod.relationships.depends_on.push(otherMod.name);
        otherMod.relationships.used_by.push(mod.name);
      }
    }
  }

  // Deduplicate
  for (const mod of modules) {
    mod.relationships.depends_on = [...new Set(mod.relationships.depends_on)];
    mod.relationships.used_by = [...new Set(mod.relationships.used_by)];
  }

  return modules;
}

/**
 * Detect common entry points in the file list.
 */
function detectEntryPoints(files: string[]): string[] {
  const entryPatterns = [
    /^src\/index\.[tj]sx?$/,
    /^src\/main\.[tj]sx?$/,
    /^src\/app\.[tj]sx?$/,
    /^src\/cli\/index\.[tj]sx?$/,
    /^src\/server\.[tj]sx?$/,
    /^index\.[tj]sx?$/,
    /^main\.[tj]sx?$/,
    /^app\.[tj]sx?$/,
    /^manage\.py$/,
    /^main\.go$/,
    /^cmd\/.*\/main\.go$/,
  ];

  return files.filter((f) =>
    entryPatterns.some((pattern) => pattern.test(f)),
  );
}

/**
 * Infer a human-readable description from a directory name.
 */
function inferDescription(name: string): string {
  const descriptions: Record<string, string> = {
    cli: 'Command-line interface layer',
    commands: 'CLI command definitions',
    services: 'Business logic services',
    lib: 'Shared utility functions',
    types: 'Type definitions and schemas',
    models: 'Data models',
    views: 'View templates or components',
    controllers: 'Request handlers',
    routes: 'Route definitions',
    middleware: 'Middleware functions',
    config: 'Configuration management',
    utils: 'Utility functions',
    helpers: 'Helper functions',
    components: 'UI components',
    pages: 'Page components',
    api: 'API endpoints',
    core: 'Core application logic',
    shared: 'Shared modules',
    domain: 'Domain layer (business entities)',
    application: 'Application layer (use cases)',
    infrastructure: 'Infrastructure layer (external services)',
    templates: 'Template files',
    tests: 'Test files',
    plugins: 'Plugin modules',
    features: 'Feature modules',
    modules: 'Application modules',
    formatters: 'Output formatting',
  };

  return descriptions[name] ?? `${name} module`;
}

/**
 * Infer the common base path from a list of file paths.
 */
function inferBasePath(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) {
    const parts = paths[0]!.split('/');
    return parts.slice(0, -1).join('/');
  }

  const parts = paths[0]!.split('/');
  let common = '';
  for (let i = 0; i < parts.length - 1; i++) {
    const prefix = parts.slice(0, i + 1).join('/');
    if (paths.every((p) => p.startsWith(prefix + '/'))) {
      common = prefix;
    } else {
      break;
    }
  }
  return common || parts[0] || '';
}
