import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../../src/services/agent-sync.service.js';
import { PrerequisiteError } from '../../../src/types/errors.js';

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

beforeEach(() => {
  vol.reset();
});

describe('agent-sync.service', () => {
  it('should throw PrerequisiteError when no agents are configured', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });
    await expect(execute({ cwd: '/project' })).rejects.toThrow(PrerequisiteError);
  });

  it('should throw PrerequisiteError when specified CLI is not configured', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test
agents:
  - claude
`,
    });
    await expect(execute({ cli: 'gemini', cwd: '/project' })).rejects.toThrow(
      PrerequisiteError,
    );
  });

  it('should generate skill files for configured agent', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test-project
agents:
  - claude
knowledge:
  base_path: docs/ai-knowledge
`,
    });

    const result = await execute({ cwd: '/project' });
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.agent).toBe('claude');
    expect(result.agents[0]?.skillFiles.length).toBeGreaterThan(0);
    expect(result.totalFiles).toBeGreaterThan(0);
  });

  it('should generate skill files for a specific CLI', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test-project
agents:
  - claude
  - gemini
knowledge:
  base_path: docs/ai-knowledge
`,
    });

    const result = await execute({ cli: 'claude', cwd: '/project' });
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.agent).toBe('claude');
  });

  it('should generate entry config file', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test-project
agents:
  - claude
knowledge:
  base_path: docs/ai-knowledge
`,
    });

    const result = await execute({ cwd: '/project' });
    expect(result.agents[0]?.configFile).toBeTruthy();
    // Verify the config file was created
    const configPath = `/project/${result.agents[0]?.configFile}`;
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should sync multiple agents', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test-project
agents:
  - claude
  - gemini
knowledge:
  base_path: docs/ai-knowledge
`,
    });

    const result = await execute({ cwd: '/project' });
    expect(result.agents).toHaveLength(2);
    const agentNames = result.agents.map((a) => a.agent);
    expect(agentNames).toContain('claude');
    expect(agentNames).toContain('gemini');
  });
});
