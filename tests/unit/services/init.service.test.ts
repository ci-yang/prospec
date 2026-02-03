import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/init.service.js';
import { AlreadyExistsError } from '../../../src/types/errors.js';

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

vi.mock('node:os', () => ({
  homedir: () => '/home/testuser',
  default: { homedir: () => '/home/testuser' },
}));

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['claude']),
  Separator: class Separator {
    constructor(public text?: string) {}
  },
}));

beforeEach(() => {
  vol.reset();
});

describe('init.service', () => {
  it('should create .prospec.yaml and directories', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test-project' }),
      '/project/tsconfig.json': '{}',
    });

    const result = await execute({
      name: 'test-project',
      agents: ['claude'],
      cwd: '/project',
    });

    expect(result.projectName).toBe('test-project');
    expect(result.selectedAgents).toEqual(['claude']);
    expect(result.createdFiles).toContain('.prospec.yaml');
    expect(result.createdFiles).toContain('docs/CONSTITUTION.md');
    expect(result.createdFiles).toContain('AGENTS.md');

    // Verify files exist
    expect(fs.existsSync('/project/.prospec.yaml')).toBe(true);
    expect(fs.existsSync('/project/docs/CONSTITUTION.md')).toBe(true);
    expect(fs.existsSync('/project/AGENTS.md')).toBe(true);
    expect(fs.existsSync('/project/docs/ai-knowledge/_index.md')).toBe(true);
    expect(fs.existsSync('/project/docs/ai-knowledge/_conventions.md')).toBe(true);
    expect(fs.existsSync('/project/docs/specs/.gitkeep')).toBe(true);
  });

  it('should throw AlreadyExistsError when config exists', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: existing\n',
    });

    await expect(
      execute({ name: 'test', agents: ['claude'], cwd: '/project' }),
    ).rejects.toThrow(AlreadyExistsError);
  });

  it('should detect TypeScript tech stack', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
      '/project/tsconfig.json': '{}',
    });

    const result = await execute({
      name: 'test',
      agents: [],
      cwd: '/project',
    });

    expect(result.techStack.language).toBe('typescript');
  });

  it('should use project directory name when no name is provided', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/my-project', { recursive: true });

    const result = await execute({
      agents: ['claude'],
      cwd: '/my-project',
    });

    expect(result.projectName).toBe('my-project');
  });

  it('should skip interactive prompt when agents are provided via options', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    const result = await execute({
      name: 'test',
      agents: ['claude', 'gemini'],
      cwd: '/project',
    });

    expect(result.selectedAgents).toEqual(['claude', 'gemini']);
  });

  it('should write valid YAML config', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    await execute({
      name: 'my-app',
      agents: ['claude'],
      cwd: '/project',
    });

    const configContent = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    expect(configContent).toContain('my-app');
  });
});
