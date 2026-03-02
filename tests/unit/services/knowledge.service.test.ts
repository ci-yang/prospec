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

  it('should call renderTemplate with key_exports in context', async () => {
    const { renderTemplate: mockRender } = await import('../../../src/lib/template.js');

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
`,
      '/project/src/services/auth.service.ts': '',
      '/project/src/services/user.service.ts': '',
    });

    await execute({ cwd: '/project' });

    // renderTemplate is called for each module README and for _index.md
    const calls = vi.mocked(mockRender).mock.calls;
    const readmeCall = calls.find((c) => c[0] === 'steering/module-readme.hbs');
    expect(readmeCall).toBeTruthy();

    // Template context should have key_exports (not public_api)
    const context = readmeCall![1] as Record<string, unknown>;
    expect(context).toHaveProperty('key_exports');
    expect(Array.isArray(context.key_exports)).toBe(true);
    // Should NOT have public_api
    expect(context).not.toHaveProperty('public_api');
  });

  it('should generate key_exports from key files', async () => {
    const { renderTemplate: mockRender } = await import('../../../src/lib/template.js');

    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
knowledge:
  base_path: docs/ai-knowledge
`,
      '/project/docs/ai-knowledge/module-map.yaml': `modules:
  - name: lib
    description: Shared utilities
    paths:
      - src/lib/**
    keywords:
      - lib
`,
      '/project/src/lib/config.ts': '',
      '/project/src/lib/utils.ts': '',
      '/project/src/lib/template.ts': '',
    });

    await execute({ cwd: '/project' });

    const calls = vi.mocked(mockRender).mock.calls;
    const readmeCall = calls.find((c) => c[0] === 'steering/module-readme.hbs');
    const context = readmeCall![1] as Record<string, unknown>;
    const keyExports = context.key_exports as Array<{ name: string; description: string }>;

    // key_exports should have simplified export names
    expect(keyExports.length).toBeGreaterThan(0);
    expect(keyExports.length).toBeLessThanOrEqual(8);
    // Each entry should have name and description
    for (const entry of keyExports) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('description');
    }
  });

  it('should render _index.md with knowledge/index.md.hbs template', async () => {
    const { renderTemplate: mockRender } = await import('../../../src/lib/template.js');

    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
knowledge:
  base_path: docs/ai-knowledge
`,
      '/project/docs/ai-knowledge/module-map.yaml': `modules:
  - name: services
    description: Business logic
    paths:
      - src/services/**
    keywords:
      - services
`,
      '/project/src/services/auth.ts': '',
    });

    await execute({ cwd: '/project' });

    const calls = vi.mocked(mockRender).mock.calls;
    const indexCall = calls.find((c) => c[0] === 'knowledge/index.md.hbs');
    expect(indexCall).toBeTruthy();

    const context = indexCall![1] as Record<string, unknown>;
    expect(context).toHaveProperty('project_name', 'test');
    expect(context).toHaveProperty('modules');
    const modules = context.modules as Array<Record<string, unknown>>;
    expect(modules[0]).toHaveProperty('name', 'services');
    expect(modules[0]).toHaveProperty('keywords');
    expect(modules[0]).toHaveProperty('relationships');
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
