import { describe, it, expect } from 'vitest';
import {
  parseYaml,
  stringifyYaml,
  parseYamlDocument,
  stringifyYamlDocument,
} from '../../../src/lib/yaml-utils.js';
import { YamlParseError } from '../../../src/types/errors.js';

describe('parseYaml', () => {
  it('should parse valid YAML into a JavaScript object', () => {
    const result = parseYaml<{ name: string }>('name: prospec');
    expect(result).toEqual({ name: 'prospec' });
  });

  it('should parse nested YAML structures', () => {
    const yaml = `
project:
  name: test
  version: "1.0"
agents:
  - claude
  - gemini
`;
    const result = parseYaml<Record<string, unknown>>(yaml);
    expect(result).toEqual({
      project: { name: 'test', version: '1.0' },
      agents: ['claude', 'gemini'],
    });
  });

  it('should throw YamlParseError for invalid YAML', () => {
    const invalidYaml = ':\ninvalid: [}';
    expect(() => parseYaml(invalidYaml, 'test.yaml')).toThrow(YamlParseError);
  });

  it('should include source path in error message', () => {
    try {
      parseYaml(':\n[invalid', '/path/to/file.yaml');
    } catch (err) {
      expect(err).toBeInstanceOf(YamlParseError);
      expect((err as YamlParseError).message).toContain('/path/to/file.yaml');
    }
  });

  it('should use <string> as default source path', () => {
    try {
      parseYaml(':\n[invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(YamlParseError);
      expect((err as YamlParseError).message).toContain('<string>');
    }
  });

  it('should handle empty YAML', () => {
    const result = parseYaml('');
    expect(result).toBeNull();
  });
});

describe('stringifyYaml', () => {
  it('should convert an object to YAML string', () => {
    const result = stringifyYaml({ name: 'prospec' });
    expect(result.trim()).toBe('name: prospec');
  });

  it('should handle nested objects', () => {
    const result = stringifyYaml({
      project: { name: 'test' },
      agents: ['claude'],
    });
    expect(result).toContain('project:');
    expect(result).toContain('name: test');
    expect(result).toContain('- claude');
  });

  it('should handle empty objects', () => {
    const result = stringifyYaml({});
    expect(result.trim()).toBe('{}');
  });
});

describe('parseYamlDocument', () => {
  it('should return a Document object for valid YAML', () => {
    const doc = parseYamlDocument('name: prospec');
    expect(doc).toBeDefined();
    expect(doc.toJS()).toEqual({ name: 'prospec' });
  });

  it('should preserve comments in the Document', () => {
    const yaml = `# comment\nname: prospec`;
    const doc = parseYamlDocument(yaml);
    const output = stringifyYamlDocument(doc);
    expect(output).toContain('# comment');
  });

  it('should throw YamlParseError for invalid YAML', () => {
    expect(() => parseYamlDocument(':\n[invalid')).toThrow(YamlParseError);
  });
});

describe('stringifyYamlDocument', () => {
  it('should convert a Document back to string', () => {
    const doc = parseYamlDocument('name: prospec');
    const result = stringifyYamlDocument(doc);
    expect(result.trim()).toBe('name: prospec');
  });
});
