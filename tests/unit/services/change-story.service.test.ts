import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/change-story.service.js';
import { AlreadyExistsError, ConfigNotFound } from '../../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockImplementation((templateName: string) => {
    if (templateName.includes('metadata')) {
      return 'name: test\nstatus: story\ncreated_at: "2026-01-01T00:00:00.000Z"\nrelated_modules: []\ndescription: Test\n';
    }
    return '# Rendered Template Content\n';
  }),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
});

describe('change-story.service', () => {
  it('should create change directory with proposal.md and metadata.yaml', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    const result = await execute({
      name: 'add-auth',
      description: 'Add user authentication',
      cwd: '/project',
    });

    expect(result.changeName).toBe('add-auth');
    expect(result.createdFiles).toContain('.prospec/changes/add-auth/proposal.md');
    expect(result.createdFiles).toContain('.prospec/changes/add-auth/metadata.yaml');

    // Verify files exist
    expect(fs.existsSync('/project/.prospec/changes/add-auth/proposal.md')).toBe(true);
    expect(fs.existsSync('/project/.prospec/changes/add-auth/metadata.yaml')).toBe(true);
  });

  it('should throw AlreadyExistsError when change directory exists', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });
    vol.mkdirSync('/project/.prospec/changes/add-auth', { recursive: true });

    await expect(
      execute({ name: 'add-auth', cwd: '/project' }),
    ).rejects.toThrow(AlreadyExistsError);
  });

  it('should throw ConfigNotFound when .prospec.yaml is missing', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    await expect(
      execute({ name: 'add-auth', cwd: '/project' }),
    ).rejects.toThrow(ConfigNotFound);
  });

  it('should include description in result', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    const result = await execute({
      name: 'add-feature',
      description: 'A new feature',
      cwd: '/project',
    });

    expect(result.description).toBe('A new feature');
  });

  it('should match related modules from _index.md', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
knowledge:
  base_path: docs/ai-knowledge
`,
      '/project/docs/ai-knowledge/_index.md': `# Module Index

| Module | Keywords | Status | Description | Depends On |
|--------|----------|--------|-------------|------------|
| auth | auth, authentication, login | Active | Authentication module | |
| users | users, profile | Active | User management | auth |
`,
    });

    const result = await execute({
      name: 'update-auth-flow',
      cwd: '/project',
    });

    expect(result.relatedModules.length).toBeGreaterThan(0);
    expect(result.relatedModules.some((m) => m.name === 'auth')).toBe(true);
  });

  it('should return empty related modules when _index.md does not exist', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    const result = await execute({
      name: 'add-feature',
      cwd: '/project',
    });

    expect(result.relatedModules).toEqual([]);
  });

  it('should write metadata with status "story"', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    await execute({
      name: 'new-feature',
      cwd: '/project',
    });

    const metadataContent = fs.readFileSync(
      '/project/.prospec/changes/new-feature/metadata.yaml',
      'utf-8',
    );
    expect(metadataContent).toContain('story');
  });
});
