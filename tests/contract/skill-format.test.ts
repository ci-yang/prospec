/**
 * Contract tests for Skill file format.
 *
 * Verifies that generated SKILL.md files conform to the expected format:
 * - YAML frontmatter with name and description
 * - Skill body with workflow instructions
 * - Reference files for skills that have them
 * - Copilot format with inline references
 */
import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/lib/template.js';
import { SKILL_DEFINITIONS } from '../../src/types/skill.js';

const TEMPLATE_CONTEXT = {
  project_name: 'test-project',
  knowledge_base_path: 'docs/ai-knowledge',
  constitution_path: 'docs/CONSTITUTION.md',
  tech_stack: { language: 'typescript', framework: 'express' },
  skills: SKILL_DEFINITIONS.map((s) => ({
    name: s.name,
    description: s.description,
    type: s.type,
    hasReferences: s.hasReferences,
  })),
};

describe('Skill Format Contract', () => {
  describe('Skill template rendering', () => {
    for (const skill of SKILL_DEFINITIONS) {
      describe(`${skill.name}`, () => {
        it('should render without errors', () => {
          const content = renderTemplate(
            `skills/${skill.name}.hbs`,
            TEMPLATE_CONTEXT,
          );
          expect(content).toBeTruthy();
          expect(content.length).toBeGreaterThan(0);
        });

        it('should contain YAML frontmatter', () => {
          const content = renderTemplate(
            `skills/${skill.name}.hbs`,
            TEMPLATE_CONTEXT,
          );
          // YAML frontmatter starts with ---
          expect(content.startsWith('---')).toBe(true);
          // Should have closing ---
          const secondDash = content.indexOf('---', 3);
          expect(secondDash).toBeGreaterThan(3);
        });

        it('should contain name field in frontmatter', () => {
          const content = renderTemplate(
            `skills/${skill.name}.hbs`,
            TEMPLATE_CONTEXT,
          );
          const frontmatter = extractFrontmatter(content);
          expect(frontmatter).toContain('name:');
        });

        it('should contain description field in frontmatter', () => {
          const content = renderTemplate(
            `skills/${skill.name}.hbs`,
            TEMPLATE_CONTEXT,
          );
          const frontmatter = extractFrontmatter(content);
          expect(frontmatter).toContain('description:');
        });

        it('should include project name in content', () => {
          const content = renderTemplate(
            `skills/${skill.name}.hbs`,
            TEMPLATE_CONTEXT,
          );
          expect(content).toContain('test-project');
        });
      });
    }
  });

  describe('Reference templates', () => {
    const REFERENCE_TEMPLATES = [
      'proposal-format.hbs',
      'plan-format.hbs',
      'delta-spec-format.hbs',
      'tasks-format.hbs',
      'implementation-guide.hbs',
      'knowledge-format.hbs',
      'knowledge-generate-format.hbs',
      'archive-format.hbs',
      'knowledge-update-format.hbs',
    ];

    for (const ref of REFERENCE_TEMPLATES) {
      it(`should render ${ref} without errors`, () => {
        const content = renderTemplate(
          `skills/references/${ref}`,
          TEMPLATE_CONTEXT,
        );
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });
    }
  });

  describe('Skill definitions', () => {
    it('should have 10 skill definitions', () => {
      expect(SKILL_DEFINITIONS).toHaveLength(10);
    });

    it('should include all expected skill names', () => {
      const names = SKILL_DEFINITIONS.map((s) => s.name);
      expect(names).toContain('prospec-explore');
      expect(names).toContain('prospec-new-story');
      expect(names).toContain('prospec-plan');
      expect(names).toContain('prospec-tasks');
      expect(names).toContain('prospec-ff');
      expect(names).toContain('prospec-implement');
      expect(names).toContain('prospec-verify');
      expect(names).toContain('prospec-knowledge-generate');
      expect(names).toContain('prospec-archive');
      expect(names).toContain('prospec-knowledge-update');
    });

    it('should have valid skill types', () => {
      const validTypes = ['Planning', 'Execution', 'Lifecycle'];
      for (const skill of SKILL_DEFINITIONS) {
        expect(validTypes).toContain(skill.type);
      }
    });

    it('skills with references should have hasReferences = true', () => {
      const skillsWithRefs = SKILL_DEFINITIONS.filter((s) => s.hasReferences);
      expect(skillsWithRefs.length).toBeGreaterThan(0);

      // Skills with references directories
      const refSkillNames = skillsWithRefs.map((s) => s.name);
      expect(refSkillNames).toContain('prospec-new-story');
      expect(refSkillNames).toContain('prospec-plan');
      expect(refSkillNames).toContain('prospec-tasks');
      expect(refSkillNames).toContain('prospec-implement');
      expect(refSkillNames).toContain('prospec-knowledge-generate');
      expect(refSkillNames).toContain('prospec-archive');
      expect(refSkillNames).toContain('prospec-knowledge-update');
    });
  });

  describe('Agent config templates', () => {
    const AGENT_CONFIGS = ['claude', 'gemini', 'copilot', 'codex'];

    for (const agent of AGENT_CONFIGS) {
      it(`should render ${agent}.md.hbs without errors`, () => {
        const content = renderTemplate(
          `agent-configs/${agent}.md.hbs`,
          TEMPLATE_CONTEXT,
        );
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });

      it(`should include project name in ${agent} config`, () => {
        const content = renderTemplate(
          `agent-configs/${agent}.md.hbs`,
          TEMPLATE_CONTEXT,
        );
        expect(content).toContain('test-project');
      });
    }
  });
});

/**
 * Extract YAML frontmatter from a Markdown document.
 */
function extractFrontmatter(content: string): string {
  if (!content.startsWith('---')) return '';
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return '';
  return content.slice(3, endIndex).trim();
}
