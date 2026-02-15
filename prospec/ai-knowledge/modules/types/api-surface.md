# Types Module - API Surface

> All public exports from the types/ module with exact TypeScript signatures

<!-- prospec:auto-start -->

## config.ts

### Types

```typescript
export type LogLevel = 'quiet' | 'normal' | 'verbose';

export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;

export type TechStack = z.infer<typeof TechStackSchema>;
```

### Schemas

```typescript
export const ProspecConfigSchema = z
  .object({
    version: z.string().optional(),
    project: z.object({
      name: z.string({ error: 'project.name 為必填欄位' }),
      version: z.string().optional(),
    }),
    tech_stack: TechStackSchema,
    paths: z.object({
      base_dir: z.string().optional(),
    }).catchall(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    agents: z.array(z.enum(VALID_AGENTS)).optional(),
    knowledge: KnowledgeSchema,
  })
  .passthrough();
```

### Constants

```typescript
export const KNOWLEDGE_FILE_TYPES = [
  'readme', 'api-surface', 'dependencies', 'patterns',
  'endpoints', 'components', 'screens',
] as const;

export const DEFAULT_BASE_DIR = 'prospec';

export const VALID_AGENTS = ['claude', 'gemini', 'copilot', 'codex'] as const;
```

---

## skill.ts

### Types

```typescript
export type SkillType = 'Planning' | 'Execution' | 'Lifecycle';

export type AgentFormat = 'skills-dir' | 'instructions';
```

### Interfaces

```typescript
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
```

### Constants

```typescript
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
  {
    name: 'prospec-knowledge-update',
    description: '增量更新 AI Knowledge。解析 delta-spec.md 識別受影響模組，掃描原始碼後更新模組 README、_index.md 和 module-map.yaml。Incremental knowledge update, delta-spec driven.',
    type: 'Lifecycle',
    hasReferences: true,
  },
];

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
```

---

## change.ts

### Types

```typescript
export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;

export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
```

### Schemas

```typescript
export const ChangeMetadataSchema = z.object({
  name: z.string(),
  created_at: z.string(), // ISO 8601
  status: z.enum(CHANGE_STATUSES),
  related_modules: z.array(z.string()).optional(),
  description: z.string().optional(),
});
```

### Constants

```typescript
export const CHANGE_STATUSES = ['story', 'plan', 'tasks', 'verified', 'archived'] as const;
```

---

## module-map.ts

### Types

```typescript
export type ModuleMap = z.infer<typeof ModuleMapSchema>;

export type ModuleEntry = z.infer<typeof ModuleEntrySchema>;

export type ModuleRelationships = z.infer<typeof ModuleRelationshipsSchema>;
```

### Schemas

```typescript
export const ModuleMapSchema = z.object({
  modules: z.array(ModuleEntrySchema),
});
```

**Note**: `ModuleEntrySchema` and `ModuleRelationshipsSchema` are not exported but are used internally by `ModuleMapSchema`.

---

## errors.ts

### Classes

```typescript
export class ProspecError extends Error {
  readonly code: string;
  readonly suggestion: string;

  constructor(message: string, code: string, suggestion: string);
}

export class ConfigNotFound extends ProspecError {
  constructor(path?: string);
}

export class ConfigInvalid extends ProspecError {
  constructor(details: string);
}

export class ScanError extends ProspecError {
  constructor(path: string, cause?: string);
}

export class WriteError extends ProspecError {
  constructor(path: string, cause?: string);
}

export class PermissionError extends WriteError {
  constructor(path: string);
}

export class YamlParseError extends ProspecError {
  constructor(path: string, cause?: string);
}

export class TemplateError extends ProspecError {
  constructor(templateName: string, cause?: string);
}

export class ModuleDetectionError extends ProspecError {
  constructor(cause?: string);
}

export class AlreadyExistsError extends ProspecError {
  constructor(target: string);
}

export class PrerequisiteError extends ProspecError {
  constructor(missing: string, suggestion?: string);
}
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
