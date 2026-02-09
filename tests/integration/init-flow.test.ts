/**
 * Integration test: init command flow.
 *
 * Tests the complete init flow: command → service → lib
 * Using memfs to mock the filesystem.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../src/services/init.service.js';
import { readConfig, validateConfig } from '../../src/lib/config.js';
import { AlreadyExistsError } from '../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('node:os', () => ({
  homedir: () => '/home/testuser',
  default: { homedir: () => '/home/testuser' },
}));

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['claude']),
  input: vi.fn().mockResolvedValue('prospec'),
  Separator: class Separator {
    constructor(public text?: string) {}
  },
}));

vi.mock('../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockReturnValue('# Template Content\n'),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
});

describe('Init Flow Integration', () => {
  it('should complete full init workflow: create config + dirs + templates', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-project' }),
      '/project/tsconfig.json': '{}',
    });

    // Execute init
    const result = await execute({
      name: 'my-project',
      agents: ['claude', 'gemini'],
      cwd: '/project',
    });

    // Verify result structure
    expect(result.projectName).toBe('my-project');
    expect(result.techStack.language).toBe('typescript');
    expect(result.selectedAgents).toEqual(['claude', 'gemini']);
    expect(result.createdFiles.length).toBeGreaterThan(0);

    // Verify .prospec.yaml can be read back and validated
    const configContent = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    const config = validateConfig(configContent);
    expect(config.project.name).toBe('my-project');

    // Verify directory structure (under prospec/ default base_dir)
    expect(fs.existsSync('/project/prospec/ai-knowledge')).toBe(true);
    expect(fs.existsSync('/project/prospec/specs')).toBe(true);
    expect(fs.existsSync('/project/prospec/CONSTITUTION.md')).toBe(true);
    expect(fs.existsSync('/project/AGENTS.md')).toBe(true);
  });

  it('should prevent double initialization', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test' }),
    });

    // First init
    await execute({
      name: 'test',
      agents: ['claude'],
      cwd: '/project',
    });

    // Second init should fail
    await expect(
      execute({ name: 'test', agents: ['claude'], cwd: '/project' }),
    ).rejects.toThrow(AlreadyExistsError);
  });

  it('should produce valid config that readConfig can parse', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    await execute({
      name: 'integration-test',
      agents: ['claude'],
      cwd: '/project',
    });

    // readConfig should succeed on the generated config
    const config = await readConfig('/project');
    expect(config.project.name).toBe('integration-test');
    expect(config.agents).toEqual(['claude']);
  });
});
