# CLI Module API Surface

> All public exports from the CLI module

<!-- prospec:auto-start -->
## Exports from `cli/index.ts`

### `createProgram`
```typescript
export function createProgram(): Command
```
**Description**: Creates and configures the root Commander program with all registered commands.

**Returns**: Configured `Command` instance with:
- All subcommands registered
- Global options (`--verbose`, `-q/--quiet`)
- preAction hook for config check
- Error handling configured (exitOverride, showSuggestionAfterError)

**Usage**: Called by main() entry point, can be used for testing.

---

### `GlobalOptions`
```typescript
export type GlobalOptions = {
  verbose?: boolean;
  quiet?: boolean;
};
```
**Description**: Type definition for global CLI options accessible via `program.opts<GlobalOptions>()`.

---

## Exports from `cli/commands/*.ts`

### `registerInitCommand`
```typescript
export function registerInitCommand(program: Command): void
```
**Description**: Registers the `init` command onto the program.

**Options**:
- `--name <name>`: Specify project name
- `--agents <list>`: Comma-separated list of agents (skips interactive selection)

---

### `registerSteeringCommand`
```typescript
export function registerSteeringCommand(program: Command): void
```
**Description**: Registers the `steering` command (deprecated, use `knowledge init`).

**Options**:
- `--dry-run`: Preview only
- `--depth <n>`: Scan depth (default: 10)

---

### `registerKnowledgeCommand`
```typescript
export function registerKnowledgeCommand(program: Command): Command
```
**Description**: Registers the `knowledge` command group and `generate` subcommand.

**Returns**: The `knowledge` command group (for attaching subcommands).

**Subcommand**: `generate` (deprecated, use `/prospec-knowledge-generate` skill)
**Options**:
- `--dry-run`: Preview only

---

### `registerKnowledgeInitCommand`
```typescript
export function registerKnowledgeInitCommand(
  knowledge: Command,
  program: Command,
): void
```
**Description**: Registers the `init` subcommand under the `knowledge` command group.

**Parameters**:
- `knowledge`: The parent `knowledge` command group
- `program`: The root program (for accessing global options)

**Options**:
- `--dry-run`: Preview only
- `--depth <n>`: Scan depth (default: 10)

---

### `registerAgentCommand`
```typescript
export function registerAgentCommand(program: Command): void
```
**Description**: Registers the `agent` command group and `sync` subcommand.

**Subcommand**: `sync`
**Options**:
- `--cli <name>`: Specify specific CLI (claude/gemini/copilot/codex)

---

### `registerChangeCommand`
```typescript
export function registerChangeCommand(program: Command): void
```
**Description**: Registers the `change` command group and `story` subcommand.

**Subcommand**: `story <name>`
**Arguments**:
- `<name>`: Change name (kebab-case)

**Options**:
- `--description <desc>`: Change description

---

### `registerChangePlanCommand`
```typescript
export function registerChangePlanCommand(program: Command): void
```
**Description**: Registers the `plan` subcommand under the existing `change` command group.

**Options**:
- `--change <name>`: Specify change name

---

### `registerChangeTasksCommand`
```typescript
export function registerChangeTasksCommand(program: Command): void
```
**Description**: Registers the `tasks` subcommand under the existing `change` command group.

**Options**:
- `--change <name>`: Specify change name

---

## Exports from `cli/formatters/error-output.ts`

### `handleError`
```typescript
export function handleError(error: unknown, verbose?: boolean): void
```
**Description**: Unified error handler that dispatches to appropriate formatter based on error type.

**Parameters**:
- `error`: The error to handle (ProspecError or generic)
- `verbose`: If true, show stack trace for generic errors

**Side Effects**: Sets `process.exitCode = 1`, writes to stderr.

---

### `formatProspecError`
```typescript
export function formatProspecError(error: ProspecError): void
```
**Description**: Format and output a ProspecError with suggestion highlighting.

**Output Format**:
```
✗ [error message]
  → [suggestion with cyan-highlighted commands]
```

---

### `formatGenericError`
```typescript
export function formatGenericError(error: unknown, verbose?: boolean): void
```
**Description**: Format and output a generic (non-Prospec) error with optional stack trace.

---

## Exports from `cli/formatters/init-output.ts`

### `formatInitOutput`
```typescript
export function formatInitOutput(
  result: InitResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the InitResult for terminal output with styled sections.

**Sections**:
1. Created files (✓ green)
2. Tech stack detected (cyan values)
3. AI Assistants status (✓ detected, ○ not installed)
4. Selected agents summary
5. Next steps suggestion

---

## Exports from `cli/formatters/steering-output.ts`

### `formatSteeringOutput`
```typescript
export function formatSteeringOutput(
  result: SteeringResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the SteeringResult for terminal output with module relationships.

**Sections** (verbose mode shows more):
1. Scan summary (file count, module count, architecture)
2. Entry points (verbose)
3. Modules with file counts
4. Module keywords and relationships (verbose)
5. Output files (✓ green)
6. Dry-run notice (⚠ yellow)
7. Next steps

---

## Exports from `cli/formatters/knowledge-output.ts`

### `formatKnowledgeOutput`
```typescript
export function formatKnowledgeOutput(
  result: KnowledgeResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the KnowledgeResult for terminal output.

**Sections**:
1. Module summary count
2. Module list with keywords (verbose)
3. Generated files (✓ Created / ✓ Updated)
4. Dry-run notice
5. Next steps

---

## Exports from `cli/formatters/knowledge-init-output.ts`

### `formatKnowledgeInitOutput`
```typescript
export function formatKnowledgeInitOutput(
  result: KnowledgeInitResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the KnowledgeInitResult for terminal output.

**Sections**:
1. Scan summary (files, depth)
2. Entry points
3. Dependencies count (verbose shows first 20)
4. Output files
5. Dry-run notice
6. Next steps

---

## Exports from `cli/formatters/change-story-output.ts`

### `formatChangeStoryOutput`
```typescript
export function formatChangeStoryOutput(
  result: ChangeStoryResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the ChangeStoryResult for terminal output.

**Sections**:
1. Created files (✓ green)
2. Description (if provided)
3. Related modules (if matched)
4. Next steps

---

## Exports from `cli/formatters/change-plan-output.ts`

### `formatChangePlanOutput`
```typescript
export function formatChangePlanOutput(
  result: ChangePlanResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the ChangePlanResult for terminal output.

**Sections**:
1. Created files (✓ green)
2. Status update (→ plan)
3. Related modules
4. Next steps

---

## Exports from `cli/formatters/change-tasks-output.ts`

### `formatChangeTasksOutput`
```typescript
export function formatChangeTasksOutput(
  result: ChangeTasksResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the ChangeTasksResult for terminal output.

**Sections**:
1. Created files (✓ green)
2. Status update (→ tasks)
3. Related modules
4. Next steps

---

## Exports from `cli/formatters/agent-sync-output.ts`

### `formatAgentSyncOutput`
```typescript
export function formatAgentSyncOutput(
  result: AgentSyncFullResult,
  logLevel?: LogLevel,
): void
```
**Description**: Format the AgentSyncFullResult for terminal output with tree-style layout.

**Sections**:
1. Summary (agent count, total files)
2. Per-agent tree (config file + skills + references)
   - Verbose: shows all file paths
   - Normal: shows skill/reference counts
3. Next steps

**Tree Format**:
```
├── Claude Code
│   ✓ config.yaml
│   ✓ 8 skills
│   ✓ 12 references
└── Gemini
    ✓ config.yaml
    ✓ 8 skills
```
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
