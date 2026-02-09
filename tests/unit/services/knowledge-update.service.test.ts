import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';
import {
  parseDeltaSpec,
  identifyAffectedModules,
  updateModuleReadme,
  markModuleDeprecated,
  updateModuleMap,
  execute,
} from '../../../src/services/knowledge-update.service.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../../src/lib/config.js', () => ({
  readConfig: vi.fn().mockResolvedValue({
    project: { name: 'test-project' },
    knowledge: { base_path: 'docs/ai-knowledge' },
    exclude: [],
  }),
  resolveBasePaths: vi.fn().mockReturnValue({
    baseDir: '/test/docs',
    knowledgePath: '/test/docs/ai-knowledge',
    constitutionPath: '/test/docs/CONSTITUTION.md',
    specsPath: '/test/docs/specs',
  }),
}));

vi.mock('../../../src/lib/scanner.js', () => ({
  scanDir: vi.fn().mockResolvedValue({
    files: ['src/services/foo.service.ts', 'src/services/bar.ts'],
    count: 2,
  }),
}));

vi.mock('../../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockReturnValue(
    '# Test Module\n\n<!-- prospec:auto-start -->\n## Overview\n\nTest content\n<!-- prospec:auto-end -->\n\n<!-- prospec:user-start -->\n<!-- prospec:user-end -->\n',
  ),
}));

beforeEach(() => {
  vol.reset();
});

// --- parseDeltaSpec ---

describe('parseDeltaSpec', () => {
  it('should parse ADDED/MODIFIED/REMOVED sections', () => {
    const content = `# Delta Spec

## ADDED

### REQ-AUTH-001: Add authentication module

**Description:** New auth system

---

### REQ-AUTH-002: Add token management

**Description:** Token refresh

---

## MODIFIED

### REQ-SERVICES-010: Update service layer

**Before:** Old behavior
**After:** New behavior

---

## REMOVED

### REQ-LEGACY-001: Remove deprecated API

**Reason:** No longer needed

---
`;

    const result = parseDeltaSpec(content);
    expect(result.added).toHaveLength(2);
    expect(result.added[0]!.id).toBe('REQ-AUTH-001');
    expect(result.added[0]!.module).toBe('auth');
    expect(result.added[0]!.description).toBe('Add authentication module');
    expect(result.added[1]!.id).toBe('REQ-AUTH-002');

    expect(result.modified).toHaveLength(1);
    expect(result.modified[0]!.id).toBe('REQ-SERVICES-010');
    expect(result.modified[0]!.module).toBe('services');

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]!.id).toBe('REQ-LEGACY-001');
    expect(result.removed[0]!.module).toBe('legacy');
  });

  it('should return empty result for empty content', () => {
    const result = parseDeltaSpec('');
    expect(result.added).toEqual([]);
    expect(result.modified).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('should return empty result for malformed content', () => {
    const result = parseDeltaSpec('just some random text\nno headers\n');
    expect(result.added).toEqual([]);
    expect(result.modified).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('should handle multi-word module names in REQ IDs', () => {
    const content = `## ADDED

### REQ-API-MIDDLEWARE-001: Add rate limiting

**Description:** Rate limiter
`;

    const result = parseDeltaSpec(content);
    expect(result.added).toHaveLength(1);
    expect(result.added[0]!.module).toBe('api-middleware');
  });
});

// --- identifyAffectedModules ---

describe('identifyAffectedModules', () => {
  it('should return raw module names when module-map.yaml does not exist', () => {
    vol.fromJSON({});
    vol.mkdirSync('/project', { recursive: true });

    const delta = {
      added: [{ id: 'REQ-AUTH-001', module: 'auth', description: 'Auth' }],
      modified: [{ id: 'REQ-SERVICES-010', module: 'services', description: 'Update' }],
      removed: [],
    };

    const result = identifyAffectedModules(delta, '/project/docs/ai-knowledge/module-map.yaml');
    expect(result).toContain('auth');
    expect(result).toContain('services');
    expect(result).toHaveLength(2);
  });

  it('should map to module-map.yaml names when available', () => {
    vol.fromJSON({
      '/project/docs/ai-knowledge/module-map.yaml':
        'modules:\n  - name: auth\n    paths: ["src/auth/**"]\n    keywords: ["auth"]\n  - name: services\n    paths: ["src/services/**"]\n    keywords: ["services"]\n',
    });

    const delta = {
      added: [{ id: 'REQ-AUTH-001', module: 'auth', description: 'Auth' }],
      modified: [],
      removed: [],
    };

    const result = identifyAffectedModules(delta, '/project/docs/ai-knowledge/module-map.yaml');
    expect(result).toEqual(['auth']);
  });

  it('should deduplicate module names across sections', () => {
    vol.fromJSON({});
    vol.mkdirSync('/project', { recursive: true });

    const delta = {
      added: [{ id: 'REQ-AUTH-001', module: 'auth', description: 'Add' }],
      modified: [{ id: 'REQ-AUTH-002', module: 'auth', description: 'Modify' }],
      removed: [],
    };

    const result = identifyAffectedModules(delta, '/project/nonexistent.yaml');
    expect(result).toEqual(['auth']);
  });
});

// --- updateModuleReadme ---

describe('updateModuleReadme', () => {
  it('should create new module README.md', async () => {
    vol.fromJSON({});
    vol.mkdirSync('/project/docs/ai-knowledge/modules', { recursive: true });

    const result = await updateModuleReadme('auth', ['src/auth/**'], {
      cwd: '/project',
      knowledgeBasePath: 'docs/ai-knowledge',
    });

    expect(result.action).toBe('created');
    expect(result.path).toBe('docs/ai-knowledge/modules/auth/README.md');

    const content = vol.readFileSync('/project/docs/ai-knowledge/modules/auth/README.md', 'utf-8');
    expect(content).toContain('prospec:auto-start');
  });

  it('should update existing module README.md preserving user sections', async () => {
    const existingContent =
      '# Auth\n\n<!-- prospec:auto-start -->\nOld auto content\n<!-- prospec:auto-end -->\n\n<!-- prospec:user-start -->\nMy custom notes\n<!-- prospec:user-end -->\n';

    vol.fromJSON({
      '/project/docs/ai-knowledge/modules/auth/README.md': existingContent,
    });

    const result = await updateModuleReadme('auth', ['src/auth/**'], {
      cwd: '/project',
      knowledgeBasePath: 'docs/ai-knowledge',
    });

    expect(result.action).toBe('updated');

    const content = vol.readFileSync('/project/docs/ai-knowledge/modules/auth/README.md', 'utf-8') as string;
    expect(content).toContain('My custom notes');
  });
});

// --- markModuleDeprecated ---

describe('markModuleDeprecated', () => {
  it('should add deprecated banner to existing README', async () => {
    vol.fromJSON({
      '/project/docs/ai-knowledge/modules/legacy/README.md': '# Legacy\n\nSome content\n',
    });

    const result = await markModuleDeprecated('legacy', 'No longer needed', {
      cwd: '/project',
      knowledgeBasePath: 'docs/ai-knowledge',
    });

    expect(result).not.toBeNull();
    expect(result!.action).toBe('deprecated');

    const content = vol.readFileSync('/project/docs/ai-knowledge/modules/legacy/README.md', 'utf-8') as string;
    expect(content).toContain('> **DEPRECATED**');
    expect(content).toContain('No longer needed');
  });

  it('should return null if module README does not exist', async () => {
    vol.fromJSON({});
    vol.mkdirSync('/project', { recursive: true });

    const result = await markModuleDeprecated('nonexistent', 'Gone', {
      cwd: '/project',
      knowledgeBasePath: 'docs/ai-knowledge',
    });

    expect(result).toBeNull();
  });

  it('should not add duplicate deprecation banners', async () => {
    vol.fromJSON({
      '/project/docs/ai-knowledge/modules/legacy/README.md':
        '> **DEPRECATED**: This module was removed. Reason: Already deprecated\n\n# Legacy\n',
    });

    const result = await markModuleDeprecated('legacy', 'Second time', {
      cwd: '/project',
      knowledgeBasePath: 'docs/ai-knowledge',
    });

    expect(result).not.toBeNull();
    const content = vol.readFileSync('/project/docs/ai-knowledge/modules/legacy/README.md', 'utf-8') as string;
    // Should still have only one deprecation banner
    const matches = content.match(/> \*\*DEPRECATED\*\*/g);
    expect(matches).toHaveLength(1);
  });
});

// --- updateModuleMap ---

describe('updateModuleMap', () => {
  it('should add new modules to module-map.yaml', async () => {
    vol.fromJSON({
      '/project/module-map.yaml':
        'modules:\n  - name: services\n    paths: ["src/services/**"]\n    keywords: ["services"]\n',
    });

    const result = await updateModuleMap(
      { added: ['auth'], removed: [] },
      '/project/module-map.yaml',
    );

    expect(result).not.toBeNull();
    const content = vol.readFileSync('/project/module-map.yaml', 'utf-8') as string;
    expect(content).toContain('auth');
  });

  it('should remove modules from module-map.yaml', async () => {
    vol.fromJSON({
      '/project/module-map.yaml':
        'modules:\n  - name: services\n    paths: ["src/services/**"]\n    keywords: ["services"]\n  - name: legacy\n    paths: ["src/legacy/**"]\n    keywords: ["legacy"]\n',
    });

    const result = await updateModuleMap(
      { added: [], removed: ['legacy'] },
      '/project/module-map.yaml',
    );

    expect(result).not.toBeNull();
    const content = vol.readFileSync('/project/module-map.yaml', 'utf-8') as string;
    expect(content).not.toContain('legacy');
    expect(content).toContain('services');
  });

  it('should return null when module-map.yaml does not exist', async () => {
    vol.fromJSON({});
    vol.mkdirSync('/project', { recursive: true });

    const result = await updateModuleMap(
      { added: ['auth'], removed: [] },
      '/project/nonexistent.yaml',
    );

    expect(result).toBeNull();
  });
});

// --- execute ---

describe('execute', () => {
  it('should process delta-spec mode', async () => {
    const deltaContent = `## ADDED

### REQ-AUTH-001: Add authentication

**Description:** New auth

---
`;

    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\ntech_stack:\n  language: typescript\n',
      '/project/docs/ai-knowledge/_index.md': '# AI Knowledge Index\n\n<!-- prospec:auto-start -->\n## Modules\n<!-- prospec:auto-end -->\n\n<!-- prospec:user-start -->\n<!-- prospec:user-end -->\n',
      '/project/delta-spec.md': deltaContent,
    });

    const result = await execute({
      deltaSpecPath: '/project/delta-spec.md',
      cwd: '/project',
    });

    expect(result.created).toContain('auth');
    expect(result.generatedFiles.length).toBeGreaterThan(0);
  });

  it('should process manual mode', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\ntech_stack:\n  language: typescript\n',
      '/project/docs/ai-knowledge/_index.md': '# AI Knowledge Index\n\n<!-- prospec:auto-start -->\n## Modules\n<!-- prospec:auto-end -->\n\n<!-- prospec:user-start -->\n<!-- prospec:user-end -->\n',
    });

    const result = await execute({
      manualModules: ['services'],
      cwd: '/project',
    });

    expect(result.generatedFiles.length).toBeGreaterThan(0);
  });

  it('should return empty result when no input provided', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\ntech_stack:\n  language: typescript\n',
      '/project/docs/ai-knowledge/_index.md': '# AI Knowledge Index\n\n<!-- prospec:auto-start -->\n## Modules\n<!-- prospec:auto-end -->\n\n<!-- prospec:user-start -->\n<!-- prospec:user-end -->\n',
    });

    const result = await execute({ cwd: '/project' });

    expect(result.created).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.deprecated).toEqual([]);
  });
});
