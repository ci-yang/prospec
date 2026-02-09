import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { detectTechStack } from '../../../src/lib/detector.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

describe('detectTechStack', () => {
  it('should detect TypeScript when package.json and tsconfig.json exist', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
      '/project/tsconfig.json': '{}',
    });
    const result = detectTechStack('/project');
    expect(result.language).toBe('typescript');
    expect(result.package_manager).toBe('npm');
  });

  it('should detect JavaScript when only package.json exists', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
    });
    const result = detectTechStack('/project');
    expect(result.language).toBe('javascript');
  });

  it('should detect Python with requirements.txt', () => {
    vol.fromJSON({
      '/project/requirements.txt': 'flask\n',
    });
    const result = detectTechStack('/project');
    expect(result.language).toBe('python');
    expect(result.package_manager).toBe('pip');
  });

  it('should detect Python with pyproject.toml', () => {
    vol.fromJSON({
      '/project/pyproject.toml': '[tool.poetry]\nname = "test"\n',
    });
    const result = detectTechStack('/project');
    expect(result.language).toBe('python');
    expect(result.package_manager).toBe('poetry');
  });

  it('should return empty result for unknown projects', () => {
    vol.fromJSON({ '/project/.gitignore': '*.log' });
    const result = detectTechStack('/project');
    expect(result.language).toBeUndefined();
    expect(result.framework).toBeUndefined();
  });

  it('should detect npm as default package manager', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
    });
    const result = detectTechStack('/project');
    expect(result.package_manager).toBe('npm');
  });

  it('should detect pnpm package manager', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
      '/project/pnpm-lock.yaml': '',
    });
    const result = detectTechStack('/project');
    expect(result.package_manager).toBe('pnpm');
  });

  it('should detect yarn package manager', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
      '/project/yarn.lock': '',
    });
    const result = detectTechStack('/project');
    expect(result.package_manager).toBe('yarn');
  });

  it('should detect bun package manager', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
      '/project/bun.lockb': '',
    });
    const result = detectTechStack('/project');
    expect(result.package_manager).toBe('bun');
  });

  it('should detect Next.js framework', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'test',
        dependencies: { next: '^14.0.0', react: '^18' },
      }),
    });
    const result = detectTechStack('/project');
    expect(result.framework).toBe('next.js');
  });

  it('should detect Express framework', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'test',
        dependencies: { express: '^4.0.0' },
      }),
    });
    const result = detectTechStack('/project');
    expect(result.framework).toBe('express');
  });

  it('should detect Vue framework', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'test',
        dependencies: { vue: '^3.0.0' },
      }),
    });
    const result = detectTechStack('/project');
    expect(result.framework).toBe('vue');
  });

  it('should detect framework from devDependencies', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'test',
        devDependencies: { svelte: '^4.0.0' },
      }),
    });
    const result = detectTechStack('/project');
    expect(result.framework).toBe('svelte');
  });
});
