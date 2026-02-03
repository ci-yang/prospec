import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { resolveConfigPath, readConfig, validateConfig, writeConfig } from '../../../src/lib/config.js';
import { ConfigNotFound, ConfigInvalid } from '../../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

describe('resolveConfigPath', () => {
  it('should resolve to .prospec.yaml in the given directory', () => {
    const result = resolveConfigPath('/my/project');
    expect(result).toBe('/my/project/.prospec.yaml');
  });

  it('should use cwd when no directory is provided', () => {
    const result = resolveConfigPath();
    expect(result).toContain('.prospec.yaml');
  });
});

describe('validateConfig', () => {
  it('should validate a correct config', () => {
    const yaml = `
project:
  name: my-project
`;
    const config = validateConfig(yaml);
    expect(config.project.name).toBe('my-project');
  });

  it('should accept optional fields', () => {
    const yaml = `
project:
  name: test
tech_stack:
  language: typescript
agents:
  - claude
  - gemini
`;
    const config = validateConfig(yaml);
    expect(config.tech_stack?.language).toBe('typescript');
    expect(config.agents).toEqual(['claude', 'gemini']);
  });

  it('should throw ConfigInvalid when project.name is missing', () => {
    const yaml = `
project:
  version: "1.0"
`;
    expect(() => validateConfig(yaml)).toThrow(ConfigInvalid);
  });

  it('should throw ConfigInvalid for completely invalid structure', () => {
    const yaml = `foo: bar`;
    expect(() => validateConfig(yaml)).toThrow(ConfigInvalid);
  });

  it('should passthrough unknown fields without error', () => {
    const yaml = `
project:
  name: test
custom_field: value
`;
    const config = validateConfig(yaml);
    expect(config.project.name).toBe('test');
    expect((config as Record<string, unknown>)['custom_field']).toBe('value');
  });

  it('should accept valid agent names', () => {
    const yaml = `
project:
  name: test
agents:
  - claude
  - gemini
  - copilot
  - codex
`;
    const config = validateConfig(yaml);
    expect(config.agents).toHaveLength(4);
  });
});

describe('readConfig', () => {
  it('should read and validate an existing config', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
    });
    const config = await readConfig('/project');
    expect(config.project.name).toBe('test-project');
  });

  it('should throw ConfigNotFound when file does not exist', async () => {
    vol.fromJSON({}, '/');
    await expect(readConfig('/project')).rejects.toThrow(ConfigNotFound);
  });

  it('should throw ConfigInvalid for invalid content', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'invalid: true\n',
    });
    await expect(readConfig('/project')).rejects.toThrow(ConfigInvalid);
  });
});

describe('writeConfig', () => {
  it('should write config to .prospec.yaml', async () => {
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });
    await writeConfig({ project: { name: 'test' } }, '/project');
    const content = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    expect(content).toContain('name: test');
  });

  it('should overwrite existing config', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: old\n',
    });
    await writeConfig({ project: { name: 'new' } }, '/project');
    const content = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    expect(content).toContain('name: new');
  });
});
