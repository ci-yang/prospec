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
  base_dir: 'docs',
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
      'capability-spec-format.hbs',
      'design-spec-format.hbs',
      'interaction-spec-format.hbs',
      'adapter-pencil.hbs',
      'adapter-figma.hbs',
      'adapter-penpot.hbs',
      'adapter-html.hbs',
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
    it('should have 11 skill definitions', () => {
      expect(SKILL_DEFINITIONS).toHaveLength(11);
    });

    it('should include all expected skill names', () => {
      const names = SKILL_DEFINITIONS.map((s) => s.name);
      expect(names).toContain('prospec-explore');
      expect(names).toContain('prospec-new-story');
      expect(names).toContain('prospec-plan');
      expect(names).toContain('prospec-design');
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
      expect(refSkillNames).toContain('prospec-design');
      expect(refSkillNames).toContain('prospec-tasks');
      expect(refSkillNames).toContain('prospec-implement');
      expect(refSkillNames).toContain('prospec-knowledge-generate');
      expect(refSkillNames).toContain('prospec-archive');
      expect(refSkillNames).toContain('prospec-knowledge-update');
    });
  });

  describe('Proposal format structure', () => {
    it('should contain 8+ required sections', () => {
      const content = renderTemplate(
        'skills/references/proposal-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('## Standard Format');
      expect(content).toContain('Background');
      expect(content).toContain('User Stories');
      expect(content).toContain('Edge Cases');
      expect(content).toContain('Functional Requirements');
      expect(content).toContain('Success Criteria');
      expect(content).toContain('Related Modules');
      expect(content).toContain('Open Questions');
      expect(content).toContain('Constitution Check');
    });

    it('should include INVEST and WHEN/THEN guidance', () => {
      const content = renderTemplate(
        'skills/references/proposal-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('INVEST');
      expect(content).toContain('WHEN');
      expect(content).toContain('THEN');
      expect(content).toContain('Priority');
    });

    it('should use Handlebars variables', () => {
      const content = renderTemplate(
        'skills/references/proposal-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('test-project');
      expect(content).toContain('docs/ai-knowledge');
      expect(content).toContain('docs/CONSTITUTION.md');
    });
  });

  describe('Capability spec format structure', () => {
    it('should contain Overview, Requirements, and Change History sections', () => {
      const content = renderTemplate(
        'skills/references/capability-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('## Purpose');
      expect(content).toContain('## Standard Format');
      expect(content).toContain('Overview');
      expect(content).toContain('Requirements');
      expect(content).toContain('Change History');
    });

    it('should include WHEN/THEN scenario format', () => {
      const content = renderTemplate(
        'skills/references/capability-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('WHEN');
      expect(content).toContain('THEN');
      expect(content).toContain('REQ ID');
    });

    it('should include maintenance rules', () => {
      const content = renderTemplate(
        'skills/references/capability-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Maintenance Rules');
      expect(content).toContain('ADDED');
      expect(content).toContain('MODIFIED');
      expect(content).toContain('REMOVED');
    });
  });

  describe('Plan format Technical Summary', () => {
    it('should contain Technical Summary section', () => {
      const content = renderTemplate(
        'skills/references/plan-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Technical Summary');
      expect(content).toContain('Brownfield');
      expect(content).toContain('Greenfield');
    });

    it('should define both Brownfield and Greenfield formats', () => {
      const content = renderTemplate(
        'skills/references/plan-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Brownfield Mode');
      expect(content).toContain('Greenfield Mode');
      expect(content).toContain('Affected Module Overview');
      expect(content).toContain('Tech Stack Detection');
    });
  });

  describe('Knowledge Quality Gate in Skills', () => {
    const SKILLS_WITH_QUALITY_GATE = [
      'prospec-new-story',
      'prospec-plan',
      'prospec-tasks',
      'prospec-implement',
      'prospec-verify',
    ];

    for (const skillName of SKILLS_WITH_QUALITY_GATE) {
      it(`${skillName} should contain Knowledge Quality Gate`, () => {
        const content = renderTemplate(
          `skills/${skillName}.hbs`,
          TEMPLATE_CONTEXT,
        );
        expect(content).toContain('Knowledge Quality Gate');
        expect(content).toContain('PASS');
        expect(content).toContain('WARN');
      });
    }
  });

  describe('Plan Brownfield/Greenfield detection', () => {
    it('should contain Context Mode Detection in prospec-plan', () => {
      const content = renderTemplate(
        'skills/prospec-plan.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Context Mode Detection');
      expect(content).toContain('Brownfield');
      expect(content).toContain('Greenfield');
    });

    it('should define detection criteria', () => {
      const content = renderTemplate(
        'skills/prospec-plan.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('>= 2 modules');
      expect(content).toContain('README.md');
    });
  });

  describe('prospec-design Skill structure', () => {
    it('should contain Generate Mode and Extract Mode', () => {
      const content = renderTemplate(
        'skills/prospec-design.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Generate Mode');
      expect(content).toContain('Extract Mode');
    });

    it('should contain NEVER list', () => {
      const content = renderTemplate(
        'skills/prospec-design.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('## NEVER');
      expect(content).toContain('NEVER');
    });

    it('should contain YAML frontmatter with design triggers', () => {
      const content = renderTemplate(
        'skills/prospec-design.hbs',
        TEMPLATE_CONTEXT,
      );
      const frontmatter = extractFrontmatter(content);
      expect(frontmatter).toContain('name: prospec-design');
      expect(frontmatter).toContain('設計');
      expect(frontmatter).toContain('Design Phase');
    });

    it('should reference platform adapters', () => {
      const content = renderTemplate(
        'skills/prospec-design.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('adapter-pencil');
      expect(content).toContain('adapter-figma');
      expect(content).toContain('adapter-penpot');
      expect(content).toContain('adapter-html');
    });
  });

  describe('Design spec format structure', () => {
    it('should contain Visual Identity, Components, and Responsive Strategy', () => {
      const content = renderTemplate(
        'skills/references/design-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Visual Identity');
      expect(content).toContain('Components');
      expect(content).toContain('Responsive Strategy');
    });

    it('should contain design token examples', () => {
      const content = renderTemplate(
        'skills/references/design-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Token');
      expect(content).toContain('States');
    });
  });

  describe('Interaction spec format structure', () => {
    it('should contain States, Transitions, and Flows', () => {
      const content = renderTemplate(
        'skills/references/interaction-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('States');
      expect(content).toContain('Transitions');
      expect(content).toContain('Flows');
    });

    it('should mark DSL as draft', () => {
      const content = renderTemplate(
        'skills/references/interaction-spec-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('draft');
    });
  });

  describe('Platform adapter structure', () => {
    const ADAPTERS = [
      'adapter-pencil.hbs',
      'adapter-figma.hbs',
      'adapter-penpot.hbs',
      'adapter-html.hbs',
    ];

    for (const adapter of ADAPTERS) {
      describe(adapter, () => {
        it('should contain Design Phase, Implement Phase, and Verify Phase', () => {
          const content = renderTemplate(
            `skills/references/${adapter}`,
            TEMPLATE_CONTEXT,
          );
          expect(content).toContain('Design Phase');
          expect(content).toContain('Implement Phase');
          expect(content).toContain('Verify Phase');
        });
      });
    }
  });

  describe('Modified templates — design integration', () => {
    it('prospec-implement should reference design-spec loading', () => {
      const content = renderTemplate(
        'skills/prospec-implement.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('design-spec.md');
      expect(content).toContain('interaction-spec.md');
      expect(content).toContain('MCP');
    });

    it('prospec-verify should contain design consistency dimension', () => {
      const content = renderTemplate(
        'skills/prospec-verify.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('Design Consistency');
      expect(content).toContain('Visual Spec Compliance');
      expect(content).toContain('Interaction Spec Compliance');
    });

    it('prospec-tasks should reference design-spec in Startup Loading', () => {
      const content = renderTemplate(
        'skills/prospec-tasks.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('design-spec.md');
      expect(content).toContain('adapter MCP');
    });

    it('proposal-format should contain UI Scope section', () => {
      const content = renderTemplate(
        'skills/references/proposal-format.hbs',
        TEMPLATE_CONTEXT,
      );
      expect(content).toContain('UI Scope');
      expect(content).toContain('full');
      expect(content).toContain('partial');
      expect(content).toContain('none');
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
