/**
 * Contract tests for AI Knowledge output format.
 *
 * Verifies that generated knowledge files conform to the expected format:
 * - Module README follows Recipe-First format (≤100 lines)
 * - Module README contains required sections (Modification Guide, Ripple Effects, Pitfalls)
 * - _index.md contains Rationale column and Loading Rules section
 */
import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/lib/template.js';

describe('Knowledge Format Contract', () => {
  describe('Module README (Recipe-First format)', () => {
    const templateContext = {
      module_name: 'services',
      description: 'Business logic services',
      path: 'src/services',
      keywords: ['services', 'business', 'logic'],
      relationships: {
        depends_on: ['lib', 'types'],
        used_by: ['cli', 'commands'],
      },
      key_files: [
        { path: 'src/services/auth.service.ts', description: 'Authentication service' },
        { path: 'src/services/user.service.ts', description: 'User management service' },
        { path: 'src/services/knowledge.service.ts', description: 'Knowledge generation service' },
      ],
      key_exports: [
        { name: 'auth.execute()', description: 'Authentication service' },
        { name: 'user.execute()', description: 'User management service' },
        { name: 'knowledge.execute()', description: 'Knowledge generation service' },
      ],
    };

    it('should render without errors', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should be ≤ 100 lines', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(100);
    });

    it('should contain Modification Guide section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Modification Guide');
    });

    it('should contain Ripple Effects section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Ripple Effects');
    });

    it('should contain Pitfalls section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Pitfalls');
    });

    it('should contain Key Files section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Key Files');
    });

    it('should contain Public API section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Public API');
    });

    it('should contain Dependencies section', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('## Dependencies');
    });

    it('should contain prospec:auto markers', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('prospec:auto-start');
      expect(content).toContain('prospec:auto-end');
    });

    it('should contain prospec:user markers', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).toContain('prospec:user-start');
      expect(content).toContain('prospec:user-end');
    });

    it('should NOT contain api-surface, dependencies.md, or patterns.md references', () => {
      const content = renderTemplate('steering/module-readme.hbs', templateContext);
      expect(content).not.toContain('api-surface.md');
      expect(content).not.toContain('dependencies.md');
      expect(content).not.toContain('patterns.md');
    });
  });

  describe('_index.md format', () => {
    const templateContext = {
      project_name: 'test-project',
      tech_stack: { language: 'typescript', framework: 'express' },
      knowledge_base_path: 'docs/ai-knowledge',
      modules: [
        {
          name: 'services',
          description: 'Business logic',
          keywords: ['services'],
          relationships: {
            depends_on: ['lib'],
            used_by: ['cli'],
          },
        },
        {
          name: 'lib',
          description: 'Shared utilities',
          keywords: ['lib', 'utils'],
          relationships: {
            depends_on: [],
            used_by: ['services'],
          },
        },
      ],
    };

    it('should render without errors', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should contain Rationale column header', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      expect(content).toContain('Rationale');
    });

    it('should contain Loading Rules section', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      expect(content).toContain('## Loading Rules');
    });

    it('should define L0, L1, and L2 layers', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      expect(content).toContain('L0');
      expect(content).toContain('L1');
      expect(content).toContain('L2');
    });

    it('should not list api-surface, dependencies, or patterns as generated file types', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      // The module table should not have columns for these file types
      // (Loading Rules may mention them as "not generated" — that's OK)
      const moduleTableSection = content.split('## Loading Rules')[0] ?? '';
      expect(moduleTableSection).not.toContain('api-surface');
      expect(moduleTableSection).not.toContain('dependencies.md');
      expect(moduleTableSection).not.toContain('patterns.md');
    });

    it('should contain prospec:auto markers', () => {
      const content = renderTemplate('knowledge/index.md.hbs', templateContext);
      expect(content).toContain('prospec:auto-start');
      expect(content).toContain('prospec:auto-end');
    });
  });
});
