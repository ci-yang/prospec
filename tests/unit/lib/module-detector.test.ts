import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { detectModules } from '../../../src/lib/module-detector.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

describe('detectModules', () => {
  it('should detect modules from directory structure', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
      'src/lib/config.ts',
      'src/lib/utils.ts',
      'src/types/errors.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': 'import { config } from "../lib/config.js";',
      '/project/src/services/user.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/lib/utils.ts': '',
      '/project/src/types/errors.ts': '',
    });
    const result = detectModules(files, '/project');
    expect(result.modules.length).toBeGreaterThan(0);
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('services');
    expect(moduleNames).toContain('lib');
  });

  it('should detect architecture patterns', () => {
    const files = [
      'src/cli/index.ts',
      'src/services/auth.ts',
      'src/lib/config.ts',
      'src/types/errors.ts',
    ];
    vol.fromJSON({
      '/project/src/cli/index.ts': '',
      '/project/src/services/auth.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/types/errors.ts': '',
    });
    const result = detectModules(files, '/project');
    // pragmatic pattern requires cli, services, lib, types
    expect(result.architecture).toBe('pragmatic');
  });

  it('should detect MVC architecture', () => {
    const files = [
      'src/models/user.ts',
      'src/views/home.ts',
      'src/controllers/auth.ts',
    ];
    vol.fromJSON({
      '/project/src/models/user.ts': '',
      '/project/src/views/home.ts': '',
      '/project/src/controllers/auth.ts': '',
    });
    const result = detectModules(files, '/project');
    expect(result.architecture).toBe('mvc');
  });

  it('should use existing module-map.yaml when available', () => {
    const files = ['src/index.ts'];
    vol.fromJSON({
      '/project/docs/ai-knowledge/module-map.yaml': `
modules:
  - name: core
    description: Core module
    paths:
      - src/core/**
    keywords:
      - core
    relationships:
      depends_on: []
      used_by: []
`,
      '/project/src/index.ts': '',
    });
    const result = detectModules(files, '/project');
    expect(result.modules[0]?.name).toBe('core');
  });

  it('should detect entry points', () => {
    const files = [
      'src/index.ts',
      'src/cli/index.ts',
      'src/services/auth.ts',
    ];
    vol.fromJSON({
      '/project/src/index.ts': '',
      '/project/src/cli/index.ts': '',
      '/project/src/services/auth.ts': '',
    });
    const result = detectModules(files, '/project');
    expect(result.entryPoints).toContain('src/index.ts');
    expect(result.entryPoints).toContain('src/cli/index.ts');
  });

  it('should generate keywords for modules', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
    });
    const result = detectModules(files, '/project');
    const services = result.modules.find((m) => m.name === 'services');
    expect(services?.keywords).toContain('services');
  });

  it('should skip root-level files from module detection', () => {
    const files = [
      'package.json',
      'tsconfig.json',
      'src/services/auth.ts',
      'src/services/user.ts',
    ];
    vol.fromJSON({
      '/project/package.json': '{}',
      '/project/tsconfig.json': '{}',
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
    });
    const result = detectModules(files, '/project');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).not.toContain('package.json');
    expect(moduleNames).not.toContain('tsconfig.json');
  });

  it('should return unknown architecture when no pattern matches', () => {
    const files = ['data/file1.csv', 'data/file2.csv'];
    vol.fromJSON({
      '/project/data/file1.csv': '',
      '/project/data/file2.csv': '',
    });
    const result = detectModules(files, '/project');
    expect(result.architecture).toBe('unknown');
  });
});
