import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/change-tasks.service.js';
import { PrerequisiteError, ConfigNotFound } from '../../../src/types/errors.js';

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

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
});

describe('change-tasks.service', () => {
  it('should create tasks.md', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/.prospec/changes/add-auth/proposal.md': '# Proposal\n',
      '/project/.prospec/changes/add-auth/plan.md': '# Plan\n',
      '/project/.prospec/changes/add-auth/metadata.yaml': `name: add-auth
created_at: "2026-01-01T00:00:00.000Z"
status: plan
related_modules: []
description: Add auth
`,
    });

    const result = await execute({ change: 'add-auth', cwd: '/project' });

    expect(result.changeName).toBe('add-auth');
    expect(result.createdFiles).toContain('.prospec/changes/add-auth/tasks.md');
    expect(fs.existsSync('/project/.prospec/changes/add-auth/tasks.md')).toBe(true);
  });

  it('should throw PrerequisiteError when plan.md does not exist', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/.prospec/changes/add-auth/proposal.md': '# Proposal\n',
      '/project/.prospec/changes/add-auth/metadata.yaml': `name: add-auth
created_at: "2026-01-01T00:00:00.000Z"
status: story
related_modules: []
description: Add auth
`,
    });

    await expect(
      execute({ change: 'add-auth', cwd: '/project' }),
    ).rejects.toThrow(PrerequisiteError);
  });

  it('should throw ConfigNotFound when .prospec.yaml is missing', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    await expect(
      execute({ change: 'add-auth', cwd: '/project' }),
    ).rejects.toThrow(ConfigNotFound);
  });

  it('should throw PrerequisiteError when change does not exist', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    await expect(
      execute({ change: 'nonexistent', cwd: '/project' }),
    ).rejects.toThrow(PrerequisiteError);
  });

  it('should auto-select when only one change exists', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/.prospec/changes/only-one/proposal.md': '# Proposal\n',
      '/project/.prospec/changes/only-one/plan.md': '# Plan\n',
      '/project/.prospec/changes/only-one/metadata.yaml': `name: only-one
created_at: "2026-01-01T00:00:00.000Z"
status: plan
related_modules: []
description: Only change
`,
    });

    const result = await execute({ cwd: '/project' });
    expect(result.changeName).toBe('only-one');
  });

  it('should update metadata status to tasks', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/.prospec/changes/add-auth/proposal.md': '# Proposal\n',
      '/project/.prospec/changes/add-auth/plan.md': '# Plan\n',
      '/project/.prospec/changes/add-auth/metadata.yaml': `name: add-auth
created_at: "2026-01-01T00:00:00.000Z"
status: plan
related_modules: []
description: Add auth
`,
    });

    await execute({ change: 'add-auth', cwd: '/project' });

    const metadataContent = fs.readFileSync(
      '/project/.prospec/changes/add-auth/metadata.yaml',
      'utf-8',
    );
    expect(metadataContent).toContain('tasks');
  });

  it('should throw in quiet mode with multiple changes', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
      '/project/.prospec/changes/change-a/plan.md': '# A\n',
      '/project/.prospec/changes/change-b/plan.md': '# B\n',
    });

    await expect(
      execute({ quiet: true, cwd: '/project' }),
    ).rejects.toThrow(PrerequisiteError);
  });
});
