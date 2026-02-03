import * as path from 'node:path';
import { checkbox, Separator } from '@inquirer/prompts';
import { AlreadyExistsError } from '../types/errors.js';
import type { ProspecConfig } from '../types/config.js';
import { writeConfig } from '../lib/config.js';
import { fileExists, ensureDir, atomicWrite } from '../lib/fs-utils.js';
import { detectTechStack } from '../lib/detector.js';
import type { TechStackResult } from '../lib/detector.js';
import { detectAgents } from '../lib/agent-detector.js';
import type { AgentInfo } from '../lib/agent-detector.js';
import { renderTemplate } from '../lib/template.js';

export interface InitOptions {
  name?: string;
  agents?: string[];
  cwd?: string;
}

export interface InitResult {
  projectName: string;
  techStack: TechStackResult;
  agentInfos: AgentInfo[];
  selectedAgents: string[];
  createdFiles: string[];
}

/**
 * Execute the init workflow:
 *
 * 1. Check if .prospec.yaml already exists → AlreadyExistsError
 * 2. Detect tech stack from project files
 * 3. Detect installed AI CLI tools
 * 4. Prompt for agent selection (or use --agents flag)
 * 5. Write .prospec.yaml
 * 6. Create directory structure
 * 7. Render template files
 */
export async function execute(options: InitOptions): Promise<InitResult> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = path.join(cwd, '.prospec.yaml');

  // 1. Check existing config
  if (fileExists(configPath)) {
    throw new AlreadyExistsError('.prospec.yaml');
  }

  // 2. Detect tech stack
  const techStack = detectTechStack(cwd);

  // 3. Detect agents
  const agentInfos = detectAgents();

  // 4. Resolve project name
  const projectName = options.name ?? path.basename(cwd);

  // 5. Select agents
  let selectedAgents: string[];
  if (options.agents) {
    // CI/CD mode: use provided agents list
    selectedAgents = options.agents;
  } else {
    // Interactive mode: prompt with checkbox
    selectedAgents = await promptAgentSelection(agentInfos);
  }

  // 6. Build config
  const config: ProspecConfig = {
    version: '1.0',
    project: {
      name: projectName,
    },
    ...(hasTechStack(techStack)
      ? { tech_stack: techStack }
      : {}),
    paths: {},
    exclude: ['*.env*', '*credential*', '*secret*', 'node_modules', '.git'],
    agents: selectedAgents.length > 0 ? selectedAgents as ProspecConfig['agents'] : undefined,
    knowledge: {
      base_path: 'docs/ai-knowledge',
    },
  };

  // 7. Create directories
  const knowledgePath = path.join(cwd, 'docs', 'ai-knowledge');
  const modulesPath = path.join(knowledgePath, 'modules');
  const specsPath = path.join(cwd, 'docs', 'specs');

  await ensureDir(modulesPath);
  await ensureDir(specsPath);

  // 8. Write config
  await writeConfig(config, cwd);

  // 9. Render templates
  const templateContext = {
    project_name: projectName,
    tech_stack: hasTechStack(techStack) ? techStack : undefined,
    agents: selectedAgents,
  };

  const createdFiles = ['.prospec.yaml'];

  // Constitution
  const constitutionPath = path.join(cwd, 'docs', 'CONSTITUTION.md');
  const constitutionContent = renderTemplate('init/constitution.md.hbs', templateContext);
  await atomicWrite(constitutionPath, constitutionContent);
  createdFiles.push('docs/CONSTITUTION.md');

  // AGENTS.md
  const agentsPath = path.join(cwd, 'AGENTS.md');
  const agentsContent = renderTemplate('init/agents.md.hbs', templateContext);
  await atomicWrite(agentsPath, agentsContent);
  createdFiles.push('AGENTS.md');

  // Conventions
  const conventionsPath = path.join(knowledgePath, '_conventions.md');
  const conventionsContent = renderTemplate('init/conventions.md.hbs', templateContext);
  await atomicWrite(conventionsPath, conventionsContent);
  createdFiles.push('docs/ai-knowledge/_conventions.md');

  // Index
  const indexPath = path.join(knowledgePath, '_index.md');
  const indexContent = renderTemplate('init/index.md.hbs', templateContext);
  await atomicWrite(indexPath, indexContent);
  createdFiles.push('docs/ai-knowledge/_index.md');

  // .gitkeep for specs/
  const gitkeepPath = path.join(specsPath, '.gitkeep');
  await atomicWrite(gitkeepPath, '');
  createdFiles.push('docs/specs/.gitkeep');

  return {
    projectName,
    techStack,
    agentInfos,
    selectedAgents,
    createdFiles,
  };
}

async function promptAgentSelection(agentInfos: AgentInfo[]): Promise<string[]> {
  const choices = agentInfos.map((agent) => ({
    name: agent.detected
      ? `${agent.name} (detected)`
      : `${agent.name} (not installed)`,
    value: agent.id,
    checked: agent.detected,
  }));

  return checkbox({
    message: 'Select AI Assistants to configure:',
    choices: [
      new Separator('─── Available AI CLI Tools ───'),
      ...choices,
    ],
  });
}

function hasTechStack(ts: TechStackResult): boolean {
  return !!(ts.language || ts.framework || ts.package_manager);
}
