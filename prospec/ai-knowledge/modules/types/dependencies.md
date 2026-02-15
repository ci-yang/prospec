# Types Module - Dependencies

> Dependency analysis for the types/ module

<!-- prospec:auto-start -->

## Internal Imports

**None** — The `types/` module is a **leaf module** with zero internal dependencies.

It does not import from any other prospec module (`config/`, `change-service/`, `skill-service/`, etc.).

---

## External Packages

### zod

**Version**: `^3.x`
**Usage**: Schema definition, runtime validation, and type inference

**Imported symbols**:
```typescript
import { z } from 'zod';
```

**Usage pattern**:
```typescript
// Define schema
export const ProspecConfigSchema = z.object({
  project: z.object({
    name: z.string({ error: 'project.name 為必填欄位' }),
  }),
});

// Infer TypeScript type
export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;

// Runtime validation
const result = ProspecConfigSchema.safeParse(data);
```

**Why Zod**:
- Single source of truth for runtime + compile-time validation
- Zod 4 unified `error` parameter for custom error messages
- Excellent TypeScript integration via `z.infer<>`

---

## Reverse Dependencies

**Who imports from types/**:

### config/ module
- `ProspecConfigSchema` - for validating .prospec.yaml
- `VALID_AGENTS` - for agent whitelist validation
- `DEFAULT_BASE_DIR` - for default path resolution

### change-service/ module
- `ChangeMetadataSchema` - for validating metadata.yaml
- `CHANGE_STATUSES` - for status validation and transitions
- `ChangeMetadata`, `ChangeStatus` - for type annotations

### skill-service/ module
- `SKILL_DEFINITIONS` - for iterating over all 10 Skills
- `AGENT_CONFIGS` - for multi-platform Skill generation
- `SkillConfig`, `AgentConfig`, `AgentSyncResult` - for type annotations

### module-map/ module
- `ModuleMapSchema` - for validating module-map.yaml
- `ModuleMap`, `ModuleEntry`, `ModuleRelationships` - for type annotations

### commands/ (all command files)
- All error classes (`ConfigNotFound`, `ConfigInvalid`, `ScanError`, etc.) - for error handling
- `LogLevel` - for verbosity control

### tests/
- All schemas - for test fixtures and validation testing
- All error classes - for error handling tests

---

## Dependency Graph

```
types/                    (leaf module, no internal deps)
  ↑
  ├─ config/              (imports ProspecConfigSchema, VALID_AGENTS, DEFAULT_BASE_DIR)
  ├─ change-service/      (imports ChangeMetadataSchema, CHANGE_STATUSES)
  ├─ skill-service/       (imports SKILL_DEFINITIONS, AGENT_CONFIGS)
  ├─ module-map/          (imports ModuleMapSchema)
  ├─ commands/            (imports all error classes, LogLevel)
  └─ all other modules    (import type definitions as needed)
```

---

## Design Implications

### 1. Leaf Module = Zero Internal Coupling

The `types/` module never imports from other prospec modules, making it the **foundational layer** of the dependency graph.

**Benefits**:
- No circular dependency risk
- Stable API (changes here affect everything, so changes are rare)
- Can be developed/tested in isolation

### 2. Zod as Only External Dependency

Zod is the only runtime dependency, keeping the module lightweight and focused.

**Trade-offs**:
- Zod version upgrades affect all schema definitions
- Zod schema syntax changes (e.g., Zod 3→4 migration) require updates across all schemas

### 3. Single Source of Truth for Contracts

All data contracts (configs, metadata, module-map) are defined here, ensuring:
- Consistent validation logic across the codebase
- Type safety via `z.infer<>`
- No drift between runtime checks and compile-time types

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
