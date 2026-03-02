import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { detectModules } from '../../../src/lib/module-detector.js';
import type { KnowledgeStrategy } from '../../../src/types/config.js';

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

  it('should accept strategy parameter', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
      'src/lib/config.ts',
      'src/lib/utils.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/lib/utils.ts': '',
    });
    const result = detectModules(files, '/project', 'architecture');
    expect(result.modules.length).toBeGreaterThan(0);
  });
});

describe('detectModules — domain strategy', () => {
  it('should group files by domain from features/', () => {
    const files = [
      'src/features/auth/LoginPage.tsx',
      'src/features/auth/AuthService.ts',
      'src/features/checkout/CheckoutPage.tsx',
      'src/features/checkout/CartService.ts',
      'src/utils/helpers.ts',
      'src/utils/constants.ts',
    ];
    vol.fromJSON({
      '/project/src/features/auth/LoginPage.tsx': '',
      '/project/src/features/auth/AuthService.ts': '',
      '/project/src/features/checkout/CheckoutPage.tsx': '',
      '/project/src/features/checkout/CartService.ts': '',
      '/project/src/utils/helpers.ts': '',
      '/project/src/utils/constants.ts': '',
    });

    const result = detectModules(files, '/project', 'domain');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('auth');
    expect(moduleNames).toContain('checkout');
  });

  it('should detect domains from pages/ and routes/', () => {
    const files = [
      'src/pages/dashboard/index.tsx',
      'src/pages/dashboard/widgets.tsx',
      'src/routes/settings/profile.tsx',
      'src/routes/settings/billing.tsx',
    ];
    vol.fromJSON({
      '/project/src/pages/dashboard/index.tsx': '',
      '/project/src/pages/dashboard/widgets.tsx': '',
      '/project/src/routes/settings/profile.tsx': '',
      '/project/src/routes/settings/billing.tsx': '',
    });

    const result = detectModules(files, '/project', 'domain');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('dashboard');
    expect(moduleNames).toContain('settings');
  });

  it('should add infra catch-all for non-domain files', () => {
    const files = [
      'src/features/auth/Login.tsx',
      'src/features/auth/Register.tsx',
      'src/middleware/cors.ts',
      'src/middleware/logger.ts',
    ];
    vol.fromJSON({
      '/project/src/features/auth/Login.tsx': '',
      '/project/src/features/auth/Register.tsx': '',
      '/project/src/middleware/cors.ts': '',
      '/project/src/middleware/logger.ts': '',
    });

    const result = detectModules(files, '/project', 'domain');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('auth');
    expect(moduleNames).toContain('infra');
  });

  it('should require 2+ files per domain', () => {
    const files = [
      'src/features/auth/Login.tsx',
      'src/features/checkout/Cart.tsx',
    ];
    vol.fromJSON({
      '/project/src/features/auth/Login.tsx': '',
      '/project/src/features/checkout/Cart.tsx': '',
    });

    const result = detectModules(files, '/project', 'domain');
    // Each domain has only 1 file, so domain detection produces nothing
    // Falls back to resolveConflicts with empty modules
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).not.toContain('auth');
    expect(moduleNames).not.toContain('checkout');
  });
});

describe('detectModules — package strategy', () => {
  it('should detect packages from pnpm-workspace.yaml', () => {
    const files = [
      'packages/web/src/index.ts',
      'packages/web/src/App.tsx',
      'packages/api/src/index.ts',
      'packages/api/src/server.ts',
    ];
    vol.fromJSON({
      '/monorepo/pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n',
      '/monorepo/packages/web/src/index.ts': '',
      '/monorepo/packages/web/src/App.tsx': '',
      '/monorepo/packages/api/src/index.ts': '',
      '/monorepo/packages/api/src/server.ts': '',
    });

    const result = detectModules(files, '/monorepo', 'package');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('web');
    expect(moduleNames).toContain('api');
  });

  it('should detect packages from package.json workspaces', () => {
    const files = [
      'packages/shared/src/utils.ts',
      'packages/shared/src/types.ts',
      'apps/frontend/src/main.tsx',
      'apps/frontend/src/App.tsx',
    ];
    vol.fromJSON({
      '/monorepo/package.json': JSON.stringify({
        workspaces: ['packages/*', 'apps/*'],
      }),
      '/monorepo/packages/shared/src/utils.ts': '',
      '/monorepo/packages/shared/src/types.ts': '',
      '/monorepo/apps/frontend/src/main.tsx': '',
      '/monorepo/apps/frontend/src/App.tsx': '',
    });

    const result = detectModules(files, '/monorepo', 'package');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('shared');
    expect(moduleNames).toContain('frontend');
  });

  it('should fallback to packages/ directory when no workspace config', () => {
    const files = [
      'packages/core/src/index.ts',
      'packages/core/src/utils.ts',
      'packages/ui/src/Button.tsx',
      'packages/ui/src/Input.tsx',
    ];
    vol.fromJSON({
      '/monorepo/packages/core/src/index.ts': '',
      '/monorepo/packages/core/src/utils.ts': '',
      '/monorepo/packages/ui/src/Button.tsx': '',
      '/monorepo/packages/ui/src/Input.tsx': '',
    });

    const result = detectModules(files, '/monorepo', 'package');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('core');
    expect(moduleNames).toContain('ui');
  });

  it('should return empty when no package structure exists', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
    });

    const result = detectModules(files, '/project', 'package');
    // Package strategy should produce 0 modules for non-monorepo
    // Then resolveConflicts still returns empty → modules from architecture fallback in keyword/conflict steps
    expect(result.modules.length).toBe(0);
  });
});

describe('detectModules — auto strategy', () => {
  it('should prefer package strategy when monorepo detected', () => {
    const files = [
      'packages/web/src/index.ts',
      'packages/web/src/App.tsx',
      'packages/api/src/index.ts',
      'packages/api/src/server.ts',
    ];
    vol.fromJSON({
      '/monorepo/pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n',
      '/monorepo/packages/web/src/index.ts': '',
      '/monorepo/packages/web/src/App.tsx': '',
      '/monorepo/packages/api/src/index.ts': '',
      '/monorepo/packages/api/src/server.ts': '',
    });

    const result = detectModules(files, '/monorepo', 'auto');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('web');
    expect(moduleNames).toContain('api');
  });

  it('should fallback to domain when no monorepo', () => {
    const files = [
      'src/features/auth/Login.tsx',
      'src/features/auth/Register.tsx',
      'src/features/shop/Products.tsx',
      'src/features/shop/Cart.tsx',
    ];
    vol.fromJSON({
      '/project/src/features/auth/Login.tsx': '',
      '/project/src/features/auth/Register.tsx': '',
      '/project/src/features/shop/Products.tsx': '',
      '/project/src/features/shop/Cart.tsx': '',
    });

    const result = detectModules(files, '/project', 'auto');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('auth');
    expect(moduleNames).toContain('shop');
  });

  it('should fallback to architecture when no domain', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
      'src/lib/config.ts',
      'src/lib/utils.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
      '/project/src/lib/config.ts': '',
      '/project/src/lib/utils.ts': '',
    });

    const result = detectModules(files, '/project', 'auto');
    const moduleNames = result.modules.map((m) => m.name);
    expect(moduleNames).toContain('services');
    expect(moduleNames).toContain('lib');
  });

  it('should default to auto when strategy not specified', () => {
    const files = [
      'src/services/auth.ts',
      'src/services/user.ts',
    ];
    vol.fromJSON({
      '/project/src/services/auth.ts': '',
      '/project/src/services/user.ts': '',
    });

    // No strategy parameter = defaults to 'auto'
    const result = detectModules(files, '/project');
    expect(result.modules.length).toBeGreaterThan(0);
  });
});
