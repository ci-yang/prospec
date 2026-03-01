# Types Module

> Core type definitions and Zod schemas for the prospec CLI - provides data validation, type safety, and configuration contracts

<!-- prospec:auto-start -->

## Overview

The `types/` module is the **foundational type system** for the entire prospec CLI. It defines:

- **Configuration schemas** (ProspecConfig, ChangeMetadata, ModuleMap) with Zod validation
- **Skill definitions** (11 predefined Skills + Agent platform configs)
- **Error hierarchy** (structured error classes with codes and suggestions)
- **Type inference utilities** (using `z.infer<>` for compile-time type safety)

This is a **leaf module** with zero internal dependencies — all other modules import from `types/` but never vice versa.

## Responsibilities

1. **Schema Validation**: Define and validate .prospec.yaml, metadata.yaml, module-map.yaml using Zod
2. **Type Inference**: Generate TypeScript types from Zod schemas via `z.infer<>`
3. **Skill Metadata**: Centralize all 11 Skill definitions with CLI dependencies and reference flags
4. **Error Contracts**: Provide structured error classes with machine-readable codes and user-friendly suggestions
5. **Constants**: Export const arrays for enums (CHANGE_STATUSES, VALID_AGENTS, KNOWLEDGE_FILE_TYPES)

## Key Files

| File | Purpose | Exports |
|------|---------|---------|
| `config.ts` | Prospec configuration schema | `ProspecConfigSchema`, `ProspecConfig`, `TechStack`, `LogLevel`, `VALID_AGENTS`, `KNOWLEDGE_FILE_TYPES`, `DEFAULT_BASE_DIR` |
| `skill.ts` | Skill and Agent definitions | `SKILL_DEFINITIONS`, `AGENT_CONFIGS`, `SkillConfig`, `AgentConfig`, `SkillType`, `AgentFormat`, `AgentSyncResult` |
| `change.ts` | Change metadata schema | `ChangeMetadataSchema`, `ChangeMetadata`, `ChangeStatus`, `CHANGE_STATUSES` |
| `module-map.ts` | Module map schema | `ModuleMapSchema`, `ModuleMap`, `ModuleEntry`, `ModuleRelationships` |
| `spec.ts` | Feature/Product Spec schemas | `FeatureSpecFrontmatterSchema`, `ProductSpecFrontmatterSchema`, `FeatureSpecFrontmatter`, `ProductSpecFrontmatter` |
| `errors.ts` | Error class hierarchy | `ProspecError`, `ConfigNotFound`, `ConfigInvalid`, `ScanError`, `WriteError`, `YamlParseError`, `TemplateError`, `ModuleDetectionError`, `AlreadyExistsError`, `PrerequisiteError` |

## Public Interfaces

### Core Schemas

```typescript
// .prospec.yaml validation
export const ProspecConfigSchema: z.ZodObject<...>
export type ProspecConfig = z.infer<typeof ProspecConfigSchema>

// metadata.yaml validation
export const ChangeMetadataSchema: z.ZodObject<...>
export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>

// module-map.yaml validation
export const ModuleMapSchema: z.ZodObject<...>
export type ModuleMap = z.infer<typeof ModuleMapSchema>
```

### Skill System

```typescript
// 11 predefined Skills (prospec-explore, prospec-new-story, ...)
export const SKILL_DEFINITIONS: SkillConfig[]

// 4 Agent platform configs (claude, gemini, copilot, codex)
export const AGENT_CONFIGS: Record<string, AgentConfig>
```

### Error Classes

```typescript
// Base error with code + suggestion
export class ProspecError extends Error {
  readonly code: string;
  readonly suggestion: string;
}

// Specialized errors
export class ConfigNotFound extends ProspecError { ... }
export class ConfigInvalid extends ProspecError { ... }
export class ScanError extends ProspecError { ... }
// ... (10 total error classes)
```

## Dependencies

### External Packages
- **zod** `^3.x`: Schema validation and type inference

### Reverse Dependencies (who imports this module)
- `config/` - imports ProspecConfigSchema, VALID_AGENTS, DEFAULT_BASE_DIR
- `change-service/` - imports ChangeMetadataSchema, CHANGE_STATUSES
- `skill-service/` - imports SKILL_DEFINITIONS, AGENT_CONFIGS
- `module-map/` - imports ModuleMapSchema
- `commands/` - imports all error classes for error handling
- All other modules - import type definitions as needed

## Design Decisions

### 1. Zod for Runtime Validation + Type Inference

**Decision**: Use Zod schemas as single source of truth for both runtime validation and compile-time types.

**Rationale**:
- Eliminates drift between runtime checks and TypeScript types
- Automatic type inference via `z.infer<>`
- Zod 4's unified `error` parameter for custom error messages (see `ProspecConfigSchema`)

**Example**:
```typescript
export const ProspecConfigSchema = z.object({
  project: z.object({
    name: z.string({ error: 'project.name 為必填欄位' }),
  }),
});

export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;
```

### 2. Const Arrays for Enums

**Decision**: Use `as const` arrays instead of TypeScript enums for status/agent lists.

**Rationale**:
- More flexible (can iterate, include in arrays)
- Better JSON serialization
- Zod `z.enum()` requires tuple types, which `as const` provides

**Example**:
```typescript
export const CHANGE_STATUSES = ['story', 'plan', 'tasks', 'verified', 'archived'] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
```

### 3. Error Class Hierarchy

**Decision**: Extend `ProspecError` base class with specialized error types, each carrying `code` + `suggestion`.

**Rationale**:
- Machine-readable error codes for programmatic handling
- User-friendly suggestions for actionable error messages
- Type-safe error checking via `instanceof`

**Example**:
```typescript
throw new ConfigNotFound();
// → message: "找不到 .prospec.yaml 配置檔"
// → code: "CONFIG_NOT_FOUND"
// → suggestion: "請先執行 `prospec init` 初始化專案"
```

### 4. Skill Definitions as Data

**Decision**: Centralize all 11 Skill definitions in `SKILL_DEFINITIONS` array instead of code generation.

**Rationale**:
- Single source of truth for Skill metadata
- Easy to validate (all Skills, CLI dependencies, reference flags)
- Enables dynamic Skill generation across multiple agent platforms

### 5. Zero Internal Dependencies

**Decision**: `types/` module never imports from other prospec modules.

**Rationale**:
- Prevents circular dependencies
- Makes types/ a stable foundation
- Allows parallel development of other modules

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
