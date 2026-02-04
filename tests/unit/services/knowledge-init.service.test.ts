import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/knowledge-init.service.js';
import { ConfigNotFound } from '../../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockImplementation(
    (templatePath: string, context: Record<string, unknown>) => {
      if (templatePath === 'knowledge/raw-scan.md.hbs') {
        return `# Raw Scan: ${context.project_name}\n\nGenerated content\n`;
      }
      if (templatePath === 'knowledge/index.md.hbs') {
        return `# AI Knowledge Index\n\n<!-- prospec:auto-start -->\n<!-- prospec:auto-end -->\n`;
      }
      return '# Template\n';
    },
  ),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));

// Mock fast-glob to work with memfs
vi.mock('fast-glob', () => ({
  default: {
    glob: vi.fn().mockImplementation(async (_patterns: string | string[], options: { cwd?: string }) => {
      const cwd = options?.cwd ?? '/';
      try {
        const allFiles: string[] = [];
        const walkDir = (dir: string, prefix: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = `${dir}/${entry.name}`;
            const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
              if (!['node_modules', '.git', 'dist'].includes(entry.name)) {
                walkDir(fullPath, relativePath);
              }
            } else {
              allFiles.push(relativePath);
            }
          }
        };
        walkDir(cwd, '');
        return allFiles;
      } catch {
        return [];
      }
    }),
    globSync: vi.fn().mockReturnValue([]),
  },
}));

beforeEach(() => {
  vol.reset();
});

describe('knowledge-init.service', () => {
  it('should throw ConfigNotFound when .prospec.yaml is missing', async () => {
    vol.fromJSON({ '/project/src/index.ts': '' });
    await expect(execute({ cwd: '/project' })).rejects.toThrow(ConfigNotFound);
  });

  it('should generate raw-scan.md', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/package.json': JSON.stringify({
        name: 'test-project',
        dependencies: { express: '^4.0.0' },
      }),
      '/project/src/index.ts': '',
      '/project/src/services/auth.ts': '',
    });

    const result = await execute({ cwd: '/project' });

    expect(result.dryRun).toBe(false);
    expect(result.outputFiles).toContain('docs/ai-knowledge/raw-scan.md');
    expect(result.totalFiles).toBeGreaterThan(0);

    // Verify raw-scan.md was written
    const rawScan = fs.readFileSync(
      '/project/docs/ai-knowledge/raw-scan.md',
      'utf-8',
    );
    expect(rawScan).toContain('Raw Scan');
  });

  it('should generate empty skeleton (_index.md, _conventions.md)', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/src/index.ts': '',
    });

    const result = await execute({ cwd: '/project' });

    expect(result.outputFiles).toContain('docs/ai-knowledge/_index.md');
    expect(result.outputFiles).toContain('docs/ai-knowledge/_conventions.md');

    // Verify _conventions.md contains skeleton
    const conventions = fs.readFileSync(
      '/project/docs/ai-knowledge/_conventions.md',
      'utf-8',
    );
    expect(conventions).toContain('prospec:auto-start');
    expect(conventions).toContain('prospec:user-start');
  });

  it('should not overwrite existing _index.md or _conventions.md on rerun', async () => {
    const existingIndex = '# Existing Index\nCustom content\n';
    const existingConventions = '# Existing Conventions\nCustom rules\n';

    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/src/index.ts': '',
      '/project/docs/ai-knowledge/_index.md': existingIndex,
      '/project/docs/ai-knowledge/_conventions.md': existingConventions,
    });

    const result = await execute({ cwd: '/project' });

    // raw-scan.md should still be generated
    expect(result.outputFiles).toContain('docs/ai-knowledge/raw-scan.md');

    // _index.md and _conventions.md should NOT be in outputFiles (not overwritten)
    expect(result.outputFiles).not.toContain('docs/ai-knowledge/_index.md');
    expect(result.outputFiles).not.toContain('docs/ai-knowledge/_conventions.md');

    // Verify existing content is preserved
    const index = fs.readFileSync(
      '/project/docs/ai-knowledge/_index.md',
      'utf-8',
    );
    expect(index).toBe(existingIndex);

    const conventions = fs.readFileSync(
      '/project/docs/ai-knowledge/_conventions.md',
      'utf-8',
    );
    expect(conventions).toBe(existingConventions);
  });

  it('should not write files in dry-run mode', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/src/index.ts': '',
    });

    const result = await execute({ dryRun: true, cwd: '/project' });

    expect(result.dryRun).toBe(true);
    expect(result.outputFiles).toHaveLength(0);

    // Verify no files were created
    expect(() =>
      fs.readFileSync('/project/docs/ai-knowledge/raw-scan.md', 'utf-8'),
    ).toThrow();
  });

  it('should respect depth parameter for directory tree', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/src/a/b/c/d.ts': '',
    });

    const result = await execute({ depth: 2, cwd: '/project' });
    expect(result.scanDepth).toBe(2);
  });

  it('should detect dependencies from package.json', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/package.json': JSON.stringify({
        dependencies: { express: '^4.0.0', lodash: '^4.17.0' },
        devDependencies: { vitest: '^1.0.0' },
      }),
      '/project/src/index.ts': '',
    });

    const result = await execute({ cwd: '/project' });

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'express' }),
        expect.objectContaining({ name: 'lodash' }),
        expect.objectContaining({ name: 'vitest' }),
      ]),
    );
  });

  it('should collect config files', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
      '/project/tsconfig.json': '{}',
      '/project/package.json': '{}',
      '/project/src/index.ts': '',
    });

    const result = await execute({ cwd: '/project' });
    expect(result.configFiles).toEqual(
      expect.arrayContaining([
        expect.stringContaining('tsconfig.json'),
        expect.stringContaining('package.json'),
      ]),
    );
  });
});
