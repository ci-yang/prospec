import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/knowledge.service.js';
import { ConfigNotFound, PrerequisiteError } from '../../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockReturnValue('# Rendered Template Content\n'),
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
              walkDir(fullPath, relativePath);
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

describe('knowledge.service', () => {
  it('should throw ConfigNotFound when .prospec.yaml is missing', async () => {
    vol.fromJSON({ '/project/src/index.ts': '' });
    await expect(execute({ cwd: '/project' })).rejects.toThrow(ConfigNotFound);
  });

  it('should throw PrerequisiteError when module-map.yaml is missing', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });
    await expect(execute({ cwd: '/project' })).rejects.toThrow(PrerequisiteError);
  });

  it('should generate module README files', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
knowledge:
  base_path: docs/ai-knowledge
`,
      '/project/docs/ai-knowledge/module-map.yaml': `modules:
  - name: services
    description: Business logic services
    paths:
      - src/services/**
    keywords:
      - services
      - business
`,
      '/project/src/services/auth.ts': '',
    });

    const result = await execute({ cwd: '/project' });
    expect(result.moduleCount).toBe(1);
    expect(result.modules[0]?.name).toBe('services');
    expect(result.dryRun).toBe(false);
    expect(result.generatedFiles.length).toBeGreaterThan(0);
  });

  it('should not write files in dry-run mode', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
knowledge:
  base_path: docs/ai-knowledge
`,
      '/project/docs/ai-knowledge/module-map.yaml': `modules:
  - name: lib
    description: Library
    paths:
      - src/lib/**
    keywords:
      - lib
`,
      '/project/src/lib/config.ts': '',
    });

    const result = await execute({ dryRun: true, cwd: '/project' });
    expect(result.dryRun).toBe(true);
    expect(result.generatedFiles).toHaveLength(0);
  });
});
