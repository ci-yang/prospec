import * as fs from 'node:fs';
import * as path from 'node:path';
import { readConfig } from '../lib/config.js';
import { renderTemplate } from '../lib/template.js';
import { atomicWrite, ensureDir } from '../lib/fs-utils.js';
import { PrerequisiteError } from '../types/errors.js';
import {
  SKILL_DEFINITIONS,
  AGENT_CONFIGS,
  type SkillConfig,
  type AgentConfig,
  type AgentSyncResult,
} from '../types/skill.js';

export interface AgentSyncOptions {
  /** Specific CLI to sync (e.g., 'claude'). If undefined, sync all configured agents. */
  cli?: string;
  /** Working directory */
  cwd?: string;
}

export interface AgentSyncFullResult {
  /** Results per agent */
  agents: AgentSyncResult[];
  /** Total number of files generated */
  totalFiles: number;
}

/**
 * Execute the agent sync workflow:
 *
 * 1. Read config (.prospec.yaml must exist)
 * 2. Determine which agents to sync (--cli or all configured)
 * 3. For each agent:
 *    a. Generate 7 Skill files from templates
 *    b. Generate reference files for skills that have them
 *    c. Generate agent entry config (CLAUDE.md, GEMINI.md, etc.)
 * 4. Copilot special handling: single .instructions.md per skill with inline references
 * 5. Atomic writes, update rather than duplicate
 */
export async function execute(
  options: AgentSyncOptions,
): Promise<AgentSyncFullResult> {
  const cwd = options.cwd ?? process.cwd();

  // 1. Read config
  const config = await readConfig(cwd);
  const configuredAgents = config.agents ?? [];
  const knowledgeBasePath = config.knowledge?.base_path ?? 'docs/ai-knowledge';
  const constitutionPath = 'docs/CONSTITUTION.md';

  if (configuredAgents.length === 0) {
    throw new PrerequisiteError(
      '未配置任何 AI Agent',
      '請在 .prospec.yaml 的 agents 欄位中加入至少一個 agent（如 claude、gemini），或執行 `prospec init` 重新初始化',
    );
  }

  // 2. Determine which agents to sync
  let agentsToSync: string[];
  if (options.cli) {
    if (!configuredAgents.includes(options.cli as typeof configuredAgents[number])) {
      throw new PrerequisiteError(
        `Agent '${options.cli}' 未在 .prospec.yaml 中配置`,
        `已配置的 agents: ${configuredAgents.join(', ')}`,
      );
    }
    agentsToSync = [options.cli];
  } else {
    agentsToSync = [...configuredAgents];
  }

  // 3. Template context (shared across all agents)
  const templateContext = {
    project_name: config.project.name,
    knowledge_base_path: knowledgeBasePath,
    constitution_path: constitutionPath,
    tech_stack: config.tech_stack ?? {},
    skills: SKILL_DEFINITIONS.map((s) => ({
      name: s.name,
      description: s.description,
      type: s.type,
      hasReferences: s.hasReferences,
    })),
  };

  // 4. Generate for each agent
  const results: AgentSyncResult[] = [];

  for (const agentName of agentsToSync) {
    const agentConfig = AGENT_CONFIGS[agentName];
    if (!agentConfig) continue;

    const result = await syncAgent(
      agentConfig,
      templateContext,
      cwd,
    );
    results.push(result);
  }

  // 5. Compute totals
  const totalFiles = results.reduce(
    (sum, r) => sum + 1 + r.skillFiles.length + r.referenceFiles.length,
    0,
  );

  return { agents: results, totalFiles };
}

/**
 * Sync a single agent: generate skills + entry config.
 */
async function syncAgent(
  agentConfig: AgentConfig,
  templateContext: Record<string, unknown>,
  cwd: string,
): Promise<AgentSyncResult> {
  const skillFiles: string[] = [];
  const referenceFiles: string[] = [];

  if (agentConfig.format === 'instructions') {
    // Copilot: single .instructions.md per skill
    await syncCopilotSkills(
      agentConfig,
      templateContext,
      cwd,
      skillFiles,
      referenceFiles,
    );
  } else {
    // Claude, Gemini, Codex: SKILL.md in skill directories
    await syncSkillsDirSkills(
      agentConfig,
      templateContext,
      cwd,
      skillFiles,
      referenceFiles,
    );
  }

  // Generate entry config
  const configFile = await generateEntryConfig(
    agentConfig,
    templateContext,
    cwd,
  );

  return {
    agent: agentConfig.name,
    configFile,
    skillFiles,
    referenceFiles,
  };
}

/**
 * Generate skills for 'skills-dir' format agents (Claude, Gemini, Codex).
 *
 * Structure:
 *   .claude/skills/prospec-explore/SKILL.md
 *   .claude/skills/prospec-new-story/SKILL.md
 *   .claude/skills/prospec-new-story/references/proposal-format.md
 */
async function syncSkillsDirSkills(
  agentConfig: AgentConfig,
  templateContext: Record<string, unknown>,
  cwd: string,
  skillFiles: string[],
  referenceFiles: string[],
): Promise<void> {
  for (const skill of SKILL_DEFINITIONS) {
    const skillDir = path.join(cwd, agentConfig.skillPath, skill.name);
    const skillFilePath = path.join(skillDir, 'SKILL.md');

    // Render skill template
    const content = renderTemplate(
      `skills/${skill.name}.hbs`,
      templateContext,
    );

    await ensureDir(skillDir);
    await atomicWrite(skillFilePath, content);
    skillFiles.push(
      path.join(agentConfig.skillPath, skill.name, 'SKILL.md'),
    );

    // Generate reference files if applicable
    if (skill.hasReferences) {
      const refs = getSkillReferences(skill.name);
      for (const ref of refs) {
        const refDir = path.join(skillDir, 'references');
        const refFilePath = path.join(refDir, ref.outputName);

        const refContent = renderTemplate(
          `skills/references/${ref.templateName}`,
          templateContext,
        );

        await ensureDir(refDir);
        await atomicWrite(refFilePath, refContent);
        referenceFiles.push(
          path.join(
            agentConfig.skillPath,
            skill.name,
            'references',
            ref.outputName,
          ),
        );
      }
    }
  }
}

/**
 * Generate skills for 'instructions' format agents (Copilot).
 *
 * Structure:
 *   .github/instructions/prospec-explore.instructions.md
 *
 * Copilot doesn't support references/ subdirectory, so reference content
 * is appended inline to the .instructions.md file.
 */
async function syncCopilotSkills(
  agentConfig: AgentConfig,
  templateContext: Record<string, unknown>,
  cwd: string,
  skillFiles: string[],
  referenceFiles: string[],
): Promise<void> {
  const instructionsDir = path.join(cwd, agentConfig.skillPath);
  await ensureDir(instructionsDir);

  for (const skill of SKILL_DEFINITIONS) {
    const fileName = `${skill.name}.instructions.md`;
    const filePath = path.join(instructionsDir, fileName);

    // Render main skill content
    let content = renderTemplate(
      `skills/${skill.name}.hbs`,
      templateContext,
    );

    // Inline reference content for Copilot (no separate reference files)
    if (skill.hasReferences) {
      const refs = getSkillReferences(skill.name);
      for (const ref of refs) {
        const refContent = renderTemplate(
          `skills/references/${ref.templateName}`,
          templateContext,
        );
        content += `\n\n---\n\n## Reference: ${ref.title}\n\n${refContent}`;
      }
    }

    await atomicWrite(filePath, content);
    skillFiles.push(
      path.join(agentConfig.skillPath, fileName),
    );
  }
}

/**
 * Generate the agent entry configuration file.
 */
async function generateEntryConfig(
  agentConfig: AgentConfig,
  templateContext: Record<string, unknown>,
  cwd: string,
): Promise<string> {
  const templateName = `agent-configs/${agentConfig.name}.md.hbs`;
  const content = renderTemplate(templateName, templateContext);

  const configFilePath = path.join(cwd, agentConfig.configPath);
  await ensureDir(path.dirname(configFilePath));
  await atomicWrite(configFilePath, content);

  return agentConfig.configPath;
}

interface SkillReference {
  templateName: string;
  outputName: string;
  title: string;
}

/**
 * Map skill names to their reference files.
 */
function getSkillReferences(skillName: string): SkillReference[] {
  const referenceMap: Record<string, SkillReference[]> = {
    'prospec-new-story': [
      {
        templateName: 'proposal-format.hbs',
        outputName: 'proposal-format.md',
        title: 'Proposal Format',
      },
    ],
    'prospec-plan': [
      {
        templateName: 'plan-format.hbs',
        outputName: 'plan-format.md',
        title: 'Plan Format',
      },
      {
        templateName: 'delta-spec-format.hbs',
        outputName: 'delta-spec-format.md',
        title: 'Delta Spec Format',
      },
    ],
    'prospec-tasks': [
      {
        templateName: 'tasks-format.hbs',
        outputName: 'tasks-format.md',
        title: 'Tasks Format',
      },
    ],
    'prospec-implement': [
      {
        templateName: 'implementation-guide.hbs',
        outputName: 'implementation-guide.md',
        title: 'Implementation Guide',
      },
    ],
    'prospec-knowledge-generate': [
      {
        templateName: 'knowledge-format.hbs',
        outputName: 'knowledge-format.md',
        title: 'Knowledge Format',
      },
      {
        templateName: 'knowledge-generate-format.hbs',
        outputName: 'knowledge-generate-format.md',
        title: 'Knowledge Generate Format',
      },
      {
        templateName: 'api-surface-format.hbs',
        outputName: 'api-surface-format.md',
        title: 'API Surface Format',
      },
      {
        templateName: 'dependencies-format.hbs',
        outputName: 'dependencies-format.md',
        title: 'Dependencies Format',
      },
      {
        templateName: 'patterns-format.hbs',
        outputName: 'patterns-format.md',
        title: 'Patterns Format',
      },
      {
        templateName: 'endpoints-format.hbs',
        outputName: 'endpoints-format.md',
        title: 'Endpoints Format',
      },
      {
        templateName: 'components-format.hbs',
        outputName: 'components-format.md',
        title: 'Components Format',
      },
      {
        templateName: 'screens-format.hbs',
        outputName: 'screens-format.md',
        title: 'Screens Format',
      },
    ],
  };

  return referenceMap[skillName] ?? [];
}
