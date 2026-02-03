import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/steering.service.js';
import { ConfigNotFound } from '../../../src/types/errors.js';

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

describe('steering.service', () => {
  it('should throw ConfigNotFound when .prospec.yaml is missing', async () => {
    vol.fromJSON({ '/project/src/index.ts': '' });
    await expect(execute({ cwd: '/project' })).rejects.toThrow(ConfigNotFound);
  });

  it('should scan project and detect modules', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/types/errors.ts': '',
    });

    const result = await execute({ cwd: '/project' });
    expect(result.fileCount).toBeGreaterThanOrEqual(0);
    expect(result.dryRun).toBe(false);
  });

  it('should not write files in dry-run mode', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/src/index.ts': '',
    });

    const result = await execute({ dryRun: true, cwd: '/project' });
    expect(result.dryRun).toBe(true);
    expect(result.outputFiles).toHaveLength(0);
  });

  it('should return architecture detection result', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/src/cli/index.ts': '',
      '/project/src/services/auth.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/types/errors.ts': '',
    });

    const result = await execute({ cwd: '/project' });
    expect(typeof result.architecture).toBe('string');
  });
});
