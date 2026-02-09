/**
 * Skill-related type definitions for prospec agent sync.
 *
 * Describes the structure of generated Skills and Agent configurations.
 */

/**
 * Skill type categorization.
 *
 * - Planning: Depends on CLI commands to create scaffolds, then AI fills content
 * - Execution: Pure AI workflow, no CLI dependency
 * - Lifecycle: Auxiliary tools (explore has no CLI dependency)
 */
export type SkillType = 'Planning' | 'Execution' | 'Lifecycle';

/**
 * Skill configuration describing a single prospec-* Skill.
 */
export interface SkillConfig {
  /** Skill name (e.g., 'prospec-explore') */
  name: string;
  /** Skill description (shown in AI context, contains trigger words) */
  description: string;
  /** Skill type categorization */
  type: SkillType;
  /** CLI command this Skill depends on (e.g., 'prospec change story') */
  cliDependency?: string;
  /** Whether this Skill has reference files in references/ subdirectory */
  hasReferences: boolean;
}

/**
 * Agent configuration describing a target AI CLI platform.
 */
export interface AgentConfig {
  /** Agent identifier (e.g., 'claude', 'gemini', 'copilot', 'codex') */
  name: string;
  /** Base path for Skill files relative to project root */
  skillPath: string;
  /** Path for the agent's entry configuration file */
  configPath: string;
  /** Output format for this agent */
  format: AgentFormat;
}

/**
 * Agent output format.
 *
 * - 'skills-dir': Each Skill is a directory with SKILL.md (Claude, Gemini, Codex)
 * - 'instructions': Single .instructions.md file per Skill with inline references (Copilot)
 */
export type AgentFormat = 'skills-dir' | 'instructions';

/**
 * Predefined Skill definitions (9 Skills).
 */
export const SKILL_DEFINITIONS: SkillConfig[] = [
  {
    name: 'prospec-explore',
    description: '探索模式 — 作為思考夥伴，協助釐清需求、調查問題、比較方案。',
    type: 'Lifecycle',
    hasReferences: false,
  },
  {
    name: 'prospec-new-story',
    description: '建立新的變更需求。引導使用者描述需求，呼叫 prospec change story 建立結構化的 proposal.md 和 metadata.yaml。',
    type: 'Planning',
    cliDependency: 'prospec change story',
    hasReferences: true,
  },
  {
    name: 'prospec-plan',
    description: '基於變更需求生成實作計劃。讀取 proposal.md、相關模組的 AI Knowledge 和 Constitution，產出結構化的 plan.md 和 delta-spec.md。',
    type: 'Planning',
    cliDependency: 'prospec change plan',
    hasReferences: true,
  },
  {
    name: 'prospec-tasks',
    description: '將實作計劃拆分為可執行的任務清單。按架構層次排序，使用 checkbox 格式，含複雜度估算和並行標記。',
    type: 'Planning',
    cliDependency: 'prospec change tasks',
    hasReferences: true,
  },
  {
    name: 'prospec-ff',
    description: '快速前進 — 一次生成所有 planning artifacts（story → plan → tasks）。適合需求明確時快速推進。',
    type: 'Planning',
    cliDependency: 'prospec change story + plan + tasks',
    hasReferences: false,
  },
  {
    name: 'prospec-implement',
    description: '按 tasks.md 逐項實作任務。讀取任務清單，按順序實作，完成後勾選 checkbox。',
    type: 'Execution',
    hasReferences: true,
  },
  {
    name: 'prospec-verify',
    description: '驗證實作是否符合規格和計劃。執行 Constitution 完整驗證、tasks.md 完成度、spec 一致性、測試通過率。',
    type: 'Execution',
    hasReferences: false,
  },
  {
    name: 'prospec-knowledge-generate',
    description: '生成 AI Knowledge。讀取 raw-scan.md，分析專案結構，自主決定模組切割並產出模組 README 和索引。',
    type: 'Lifecycle',
    hasReferences: true,
  },
  {
    name: 'prospec-archive',
    description: '歸檔已完成的變更。掃描 changes 目錄，將 verified 狀態的變更搬移至 archive，生成 summary.md 並提示 Knowledge 更新。',
    type: 'Lifecycle',
    hasReferences: true,
  },
];

/**
 * Agent configuration definitions for all supported AI CLI platforms.
 */
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  claude: {
    name: 'claude',
    skillPath: '.claude/skills',
    configPath: 'CLAUDE.md',
    format: 'skills-dir',
  },
  gemini: {
    name: 'gemini',
    skillPath: '.gemini/skills',
    configPath: 'GEMINI.md',
    format: 'skills-dir',
  },
  copilot: {
    name: 'copilot',
    skillPath: '.github/instructions',
    configPath: '.github/copilot-instructions.md',
    format: 'instructions',
  },
  codex: {
    name: 'codex',
    skillPath: '.codex/skills',
    configPath: 'AGENTS.md',
    format: 'skills-dir',
  },
};

/**
 * Result of generating files for a single agent.
 */
export interface AgentSyncResult {
  /** Agent name */
  agent: string;
  /** Entry config file path */
  configFile: string;
  /** Generated Skill file paths */
  skillFiles: string[];
  /** Generated reference file paths */
  referenceFiles: string[];
}
