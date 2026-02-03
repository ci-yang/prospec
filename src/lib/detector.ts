import * as fs from 'node:fs';
import * as path from 'node:path';

export interface TechStackResult {
  language?: string;
  framework?: string;
  package_manager?: string;
}

/**
 * Detect the project's tech stack by scanning for known config files.
 *
 * Detection rules:
 * - package.json → Node.js; if tsconfig.json exists → TypeScript
 * - requirements.txt or pyproject.toml → Python
 * - Unrecognised → returns empty fields
 */
export function detectTechStack(cwd?: string): TechStackResult {
  const dir = cwd ?? process.cwd();
  const result: TechStackResult = {};

  // Node.js / TypeScript detection
  const pkgPath = path.join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    const tsconfigPath = path.join(dir, 'tsconfig.json');
    result.language = existsSync(tsconfigPath) ? 'typescript' : 'javascript';
    result.package_manager = detectNodePackageManager(dir);

    // Framework detection from package.json dependencies
    try {
      const raw = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      result.framework = detectNodeFramework(allDeps);
    } catch {
      // Ignore parse errors
    }

    return result;
  }

  // Python detection
  const requirementsPath = path.join(dir, 'requirements.txt');
  const pyprojectPath = path.join(dir, 'pyproject.toml');
  if (existsSync(requirementsPath) || existsSync(pyprojectPath)) {
    result.language = 'python';
    result.package_manager = existsSync(pyprojectPath) ? 'poetry' : 'pip';
    return result;
  }

  return result;
}

function existsSync(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function detectNodePackageManager(dir: string): string {
  if (existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(dir, 'bun.lockb')) || existsSync(path.join(dir, 'bun.lock'))) return 'bun';
  return 'npm';
}

function detectNodeFramework(
  deps: Record<string, string>,
): string | undefined {
  const frameworks: [string, string][] = [
    ['next', 'next.js'],
    ['nuxt', 'nuxt'],
    ['@angular/core', 'angular'],
    ['vue', 'vue'],
    ['react', 'react'],
    ['express', 'express'],
    ['fastify', 'fastify'],
    ['koa', 'koa'],
    ['hono', 'hono'],
    ['svelte', 'svelte'],
  ];

  for (const [pkg, name] of frameworks) {
    if (pkg in deps) return name;
  }

  return undefined;
}
