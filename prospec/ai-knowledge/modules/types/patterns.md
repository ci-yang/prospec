# Types Module - Patterns

> Common patterns and idioms used in the types/ module

<!-- prospec:auto-start -->

## Pattern 1: Zod Schema + Type Inference

**Problem**: Need runtime validation AND compile-time type safety without duplication.

**Solution**: Define Zod schemas and infer TypeScript types using `z.infer<>`.

**Example from config.ts**:
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

// Infer TypeScript type from schema
export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;
```

**Benefits**:
- Single source of truth (schema = type)
- Runtime validation with `schema.parse(data)` or `schema.safeParse(data)`
- Compile-time type checking with inferred type
- No drift between validation logic and TypeScript types

**When to use**:
- All configuration files (YAML, JSON)
- All API contracts between modules
- Any data that crosses module boundaries

---

## Pattern 2: Const Arrays for Enums

**Problem**: TypeScript enums are inflexible (can't iterate, poor JSON serialization).

**Solution**: Use `as const` arrays + type extraction.

**Example from change.ts**:
```typescript
export const CHANGE_STATUSES = ['story', 'plan', 'tasks', 'verified', 'archived'] as const;

// Extract union type: 'story' | 'plan' | 'tasks' | 'verified' | 'archived'
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
```

**Example from config.ts**:
```typescript
export const VALID_AGENTS = ['claude', 'gemini', 'copilot', 'codex'] as const;

// Use in Zod schema
agents: z.array(z.enum(VALID_AGENTS)).optional(),
```

**Benefits**:
- Iterable (can use `.map()`, `.filter()`, `.includes()`)
- Better JSON serialization
- Works with Zod's `z.enum()` (requires tuple type)
- Single source of truth for valid values

**When to use**:
- Status enums (change statuses, module states)
- Whitelists (valid agents, valid file types)
- Any fixed set of string literals

---

## Pattern 3: Error Class Hierarchy

**Problem**: Need structured errors with machine-readable codes and user-friendly suggestions.

**Solution**: Extend base `ProspecError` with specialized error classes.

**Example from errors.ts**:
```typescript
// Base error class
export class ProspecError extends Error {
  readonly code: string;
  readonly suggestion: string;

  constructor(message: string, code: string, suggestion: string) {
    super(message);
    this.name = 'ProspecError';
    this.code = code;
    this.suggestion = suggestion;
  }
}

// Specialized error
export class ConfigNotFound extends ProspecError {
  constructor(path?: string) {
    super(
      path
        ? `找不到配置檔：${path}`
        : '找不到 .prospec.yaml 配置檔',
      'CONFIG_NOT_FOUND',
      '請先執行 \`prospec init\` 初始化專案',
    );
    this.name = 'ConfigNotFound';
  }
}
```

**Usage**:
```typescript
// Throw
if (!configExists) {
  throw new ConfigNotFound();
}

// Catch and handle
try {
  // ...
} catch (error) {
  if (error instanceof ConfigNotFound) {
    console.error(error.message);      // User-friendly message
    console.error(error.suggestion);   // Actionable suggestion
    logger.error(error.code);          // Machine-readable code
  }
}
```

**Benefits**:
- Type-safe error checking (`instanceof`)
- Machine-readable codes for telemetry/logging
- User-friendly suggestions for CLI output
- Consistent error handling across codebase

**When to use**:
- All domain errors (config errors, file system errors, validation errors)
- Any error that should be caught and handled programmatically

---

## Pattern 4: Optional Schema Composition

**Problem**: Need flexible schemas where entire sections can be omitted.

**Solution**: Define sub-schemas with `.optional()` and compose them.

**Example from config.ts**:
```typescript
const TechStackSchema = z.object({
  language: z.string().optional(),
  framework: z.string().optional(),
  package_manager: z.string().optional(),
}).optional();  // ← Entire tech_stack can be missing

const KnowledgeSchema = z.object({
  base_path: z.string().optional(),
  files: z.array(z.string()).optional(),
}).optional();  // ← Entire knowledge section can be missing

export const ProspecConfigSchema = z.object({
  // ...
  tech_stack: TechStackSchema,    // ← Can be undefined
  knowledge: KnowledgeSchema,      // ← Can be undefined
})
.passthrough();  // ← Allow unknown keys (forward compatibility)
```

**Benefits**:
- Flexible schemas (users can omit entire sections)
- Forward compatibility (`.passthrough()` allows unknown keys)
- Type-safe access (TypeScript knows field can be `undefined`)

**When to use**:
- Configuration files where sections are optional
- Extensible schemas that may grow over time

---

## Pattern 5: Skill Definitions as Data

**Problem**: Need to maintain 10 Skill definitions with metadata (type, CLI dependency, references flag).

**Solution**: Centralize all Skill definitions in a typed array.

**Example from skill.ts**:
```typescript
export interface SkillConfig {
  name: string;
  description: string;
  type: SkillType;
  cliDependency?: string;
  hasReferences: boolean;
}

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
  // ... (8 more Skills)
];
```

**Benefits**:
- Single source of truth (all Skill metadata in one place)
- Easy to validate (TypeScript checks all required fields)
- Enables dynamic generation (iterate over array to generate Skill files)
- Searchable (find Skills by type, CLI dependency, etc.)

**When to use**:
- Fixed sets of entities with complex metadata
- Data-driven code generation

---

## Pattern 6: Record Types for Lookup Tables

**Problem**: Need type-safe lookup of Agent configs by name.

**Solution**: Use `Record<string, T>` for key-value mapping.

**Example from skill.ts**:
```typescript
export interface AgentConfig {
  name: string;
  skillPath: string;
  configPath: string;
  format: AgentFormat;
}

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
  // ... (2 more agents)
};
```

**Usage**:
```typescript
const agentConfig = AGENT_CONFIGS['claude'];
// Type: AgentConfig | undefined

if (agentConfig) {
  console.log(agentConfig.skillPath);  // .claude/skills
}
```

**Benefits**:
- Type-safe lookup (TypeScript knows value type)
- IntelliSense support for known keys
- O(1) lookup performance

**When to use**:
- Fixed set of named configurations
- Lookup tables with string keys

---

## Pattern 7: Zod Custom Error Messages

**Problem**: Need localized/custom error messages for validation failures.

**Solution**: Use Zod 4's unified `error` parameter.

**Example from config.ts**:
```typescript
export const ProspecConfigSchema = z.object({
  project: z.object({
    name: z.string({ error: 'project.name 為必填欄位' }),  // ← Custom error
  }),
});
```

**Result**:
```typescript
const result = ProspecConfigSchema.safeParse({});
if (!result.success) {
  console.log(result.error.issues[0].message);
  // → "project.name 為必填欄位"
}
```

**Benefits**:
- User-friendly error messages in preferred language
- Inline error definitions (no separate error message mapping)

**When to use**:
- Required fields in config schemas
- Localized error messages

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
