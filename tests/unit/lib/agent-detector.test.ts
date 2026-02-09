import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { detectAgents } from '../../../src/lib/agent-detector.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('node:os', () => ({
  homedir: () => '/home/testuser',
  default: { homedir: () => '/home/testuser' },
}));

beforeEach(() => {
  vol.reset();
});

describe('detectAgents', () => {
  it('should return all agents with detected: false when no directories exist', () => {
    vol.fromJSON({}, '/');
    const agents = detectAgents();
    expect(agents).toHaveLength(4);
    expect(agents.every((a) => a.detected === false)).toBe(true);
  });

  it('should detect Claude Code when .claude directory exists', () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/home/testuser/.claude', { recursive: true });
    const agents = detectAgents();
    const claude = agents.find((a) => a.id === 'claude');
    expect(claude?.detected).toBe(true);
    expect(claude?.name).toBe('Claude Code');
  });

  it('should detect Gemini CLI when .gemini directory exists', () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/home/testuser/.gemini', { recursive: true });
    const agents = detectAgents();
    const gemini = agents.find((a) => a.id === 'gemini');
    expect(gemini?.detected).toBe(true);
  });

  it('should detect GitHub Copilot when .copilot directory exists', () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/home/testuser/.copilot', { recursive: true });
    const agents = detectAgents();
    const copilot = agents.find((a) => a.id === 'copilot');
    expect(copilot?.detected).toBe(true);
  });

  it('should detect Codex CLI when .codex directory exists', () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/home/testuser/.codex', { recursive: true });
    const agents = detectAgents();
    const codex = agents.find((a) => a.id === 'codex');
    expect(codex?.detected).toBe(true);
  });

  it('should detect multiple agents simultaneously', () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/home/testuser/.claude', { recursive: true });
    vol.mkdirSync('/home/testuser/.gemini', { recursive: true });
    const agents = detectAgents();
    const detected = agents.filter((a) => a.detected);
    expect(detected).toHaveLength(2);
    expect(detected.map((a) => a.id)).toContain('claude');
    expect(detected.map((a) => a.id)).toContain('gemini');
  });

  it('should return correct agent structure', () => {
    vol.fromJSON({}, '/');
    const agents = detectAgents();
    for (const agent of agents) {
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('detected');
      expect(typeof agent.name).toBe('string');
      expect(typeof agent.id).toBe('string');
      expect(typeof agent.detected).toBe('boolean');
    }
  });
});
