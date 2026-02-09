/**
 * Integration test: skill generation flow.
 *
 * Tests agent sync generates correct skill structure for each agent type.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute } from '../../src/services/agent-sync.service.js';
import { PrerequisiteError } from '../../src/types/errors.js';
import { SKILL_DEFINITIONS, AGENT_CONFIGS } from '../../src/types/skill.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockImplementation((templateName: string) => {
    if (templateName.includes('agent-configs/')) {
      return '# Agent Config\n\nGenerated entry point.\n';
    }
    return '---\nname: test-skill\ndescription: A test skill\n---\n\n# Skill Content\n';
  }),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
});

describe('Skill Generation Integration', () => {
  it('should generate all skills for Claude agent', async () => {
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
    const claudeResult = result.agents.find((a) => a.agent === 'claude');
    expect(claudeResult).toBeTruthy();
    expect(claudeResult!.skillFiles).toHaveLength(SKILL_DEFINITIONS.length);

    // Verify SKILL.md files exist in the correct directory structure
    for (const skill of SKILL_DEFINITIONS) {
      const skillPath = `/project/.claude/skills/${skill.name}/SKILL.md`;
      expect(fs.existsSync(skillPath)).toBe(true);
    }
  });

  it('should generate reference files for skills that need them', async () => {
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
    const claudeResult = result.agents.find((a) => a.agent === 'claude');
    expect(claudeResult!.referenceFiles.length).toBeGreaterThan(0);
  });

  it('should generate entry config file for each agent', async () => {
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

    // Each agent should have a config file
    for (const agentResult of result.agents) {
      expect(agentResult.configFile).toBeTruthy();
      const configPath = `/project/${agentResult.configFile}`;
      expect(fs.existsSync(configPath)).toBe(true);
    }
  });

  it('should generate Copilot format with .instructions.md files', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': `project:
  name: test-project
agents:
  - copilot
knowledge:
  base_path: docs/ai-knowledge
`,
    });

    const result = await execute({ cwd: '/project' });
    const copilotResult = result.agents.find((a) => a.agent === 'copilot');
    expect(copilotResult).toBeTruthy();

    // Copilot uses .instructions.md format
    for (const skillFile of copilotResult!.skillFiles) {
      expect(skillFile).toContain('.instructions.md');
    }

    // Copilot should NOT have separate reference files (inline)
    expect(copilotResult!.referenceFiles).toHaveLength(0);
  });

  it('should fail when no agents are configured', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    await expect(execute({ cwd: '/project' })).rejects.toThrow(PrerequisiteError);
  });

  it('should only sync specified CLI with --cli option', async () => {
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

    const result = await execute({ cli: 'gemini', cwd: '/project' });
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.agent).toBe('gemini');
  });
});
