# CLI Module Dependencies

> Internal and external dependencies of the CLI module

<!-- prospec:auto-start -->
## Internal Dependencies

### Services (Business Logic)
All command handlers delegate to service modules for execution:

**From `services/init.service.ts`**:
- `execute(options: { name?: string; agents?: string[] }): Promise<InitResult>`
- Used by: `commands/init.ts`

**From `services/steering.service.ts`**:
- `execute(options: { dryRun?: boolean; depth?: number }): Promise<SteeringResult>`
- Used by: `commands/steering.ts`

**From `services/knowledge.service.ts`**:
- `execute(options: { dryRun?: boolean }): Promise<KnowledgeResult>`
- Used by: `commands/knowledge-generate.ts`

**From `services/knowledge-init.service.ts`**:
- `execute(options: { dryRun?: boolean; depth?: number }): Promise<KnowledgeInitResult>`
- Used by: `commands/knowledge-init.ts`

**From `services/change-story.service.ts`**:
- `execute(options: { name: string; description?: string }): Promise<ChangeStoryResult>`
- Used by: `commands/change-story.ts`

**From `services/change-plan.service.ts`**:
- `execute(options: { change?: string; quiet?: boolean }): Promise<ChangePlanResult>`
- Used by: `commands/change-plan.ts`

**From `services/change-tasks.service.ts`**:
- `execute(options: { change?: string; quiet?: boolean }): Promise<ChangeTasksResult>`
- Used by: `commands/change-tasks.ts`

**From `services/agent-sync.service.ts`**:
- `execute(options: { cli?: string }): Promise<AgentSyncFullResult>`
- Used by: `commands/agent-sync.ts`

### Types
**From `types/errors.ts`**:
- `ProspecError` — Base error class with suggestion field
- `ConfigNotFound` — Thrown by preAction hook when `.prospec.yaml` missing
- Used by: `index.ts`, `formatters/error-output.ts`

**From `types/config.ts`**:
- `LogLevel` — Type definition for 'quiet' | 'normal' | 'verbose'
- Used by: All command files and all formatter files

### Result Types
Each formatter imports its corresponding result type from the service it formats:
- `InitResult`, `TechStackResult` from `services/init.service.ts`
- `SteeringResult` from `services/steering.service.ts`
- `KnowledgeResult` from `services/knowledge.service.ts`
- `KnowledgeInitResult` from `services/knowledge-init.service.ts`
- `ChangeStoryResult` from `services/change-story.service.ts`
- `ChangePlanResult` from `services/change-plan.service.ts`
- `ChangeTasksResult` from `services/change-tasks.service.ts`
- `AgentSyncFullResult` from `services/agent-sync.service.ts`

---

## External Dependencies

### Commander.js
```typescript
import { Command } from 'commander';
import type { Command } from 'commander';
```
**Purpose**: CLI framework for parsing commands, arguments, and options.

**Usage**:
- `createProgram()` creates the root `Command` instance
- All `register*Command` functions attach subcommands
- `program.hook('preAction', ...)` for config validation
- `program.parseAsync(process.argv)` to execute

**Key Features Used**:
- `.command()` for subcommands
- `.argument()` for positional args
- `.option()` for flags
- `.action()` for handlers
- `.hook()` for lifecycle hooks
- `.exitOverride()` for error handling control

---

### @commander-js/extra-typings
```typescript
// No explicit import in code, used via tsconfig.json types field
```
**Purpose**: TypeScript type definitions for Commander.js to improve type inference.

**Why Needed**: Commander.js has complex generic types that benefit from extra type helpers.

---

### picocolors
```typescript
import pc from 'picocolors';
```
**Purpose**: Lightweight terminal color styling library.

**Usage**: All formatters use `pc` for colored output:
- `pc.red()` for errors
- `pc.green()` for success checkmarks
- `pc.yellow()` for warnings and counts
- `pc.cyan()` for highlights (values, commands)
- `pc.dim()` for secondary text

**Why picocolors**: Smaller bundle size than `chalk`, no dependencies, fast.

---

### Node.js Built-ins
```typescript
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
```
**Purpose**:
- `fs.existsSync()` for `.prospec.yaml` check in preAction hook
- `createRequire()` for loading `package.json` version in ESM context

---

## Reverse Dependencies

**None**. The CLI module is the top-level entry point for the prospec tool and is NOT imported by any other modules.

**Entry**: The CLI module is invoked directly via the `#!/usr/bin/env node` shebang in `index.ts`, which is referenced by `package.json` `"bin"` field.

**CLI → Services → Core** (dependency flow direction)
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
