# CLI Module

> Thin CLI layer built on Commander.js for prospec command execution

<!-- prospec:auto-start -->
## Overview

The CLI module serves as the entry point and command-line interface for the prospec tool. It is a thin orchestration layer that parses commands, delegates execution to service modules, and formats output for the terminal. Built on top of Commander.js with TypeScript type safety.

**Architecture**: Layered separation between parsing (commands), execution (services), and presentation (formatters).

## CLI Commands

| Command | Description | Key Options | Status |
|---------|-------------|-------------|--------|
| `prospec init` | Initialize prospec project structure | `--name`, `--agents` | Active |
| `prospec steering` | Analyze existing project architecture | `--dry-run`, `--depth` | Deprecated |
| `prospec knowledge init` | Scan project and generate raw-scan.md | `--dry-run`, `--depth` | Active |
| `prospec knowledge generate` | Generate AI Knowledge files | `--dry-run` | Deprecated |
| `prospec change story` | Create change story directory | `<name>`, `--description` | Active |
| `prospec change plan` | Generate implementation plan | `--change` | Active |
| `prospec change tasks` | Generate task breakdown | `--change` | Active |
| `prospec agent sync` | Sync AI agent configs and skills | `--cli` | Active |

**Global Options**: `--verbose` (detailed output), `-q, --quiet` (CI/CD mode)

## Key Files

### Entry Point
- **`index.ts`**: Main CLI entry, program creation, error handling, preAction hook for config check

### Commands
- **`commands/init.ts`**: Project initialization with interactive agent selection
- **`commands/steering.ts`**: (Deprecated) Legacy architecture analysis
- **`commands/knowledge-generate.ts`**: (Deprecated) Legacy knowledge generation
- **`commands/knowledge-init.ts`**: Project scanning and raw-scan generation
- **`commands/change-story.ts`**: Change workflow step 1 (story creation)
- **`commands/change-plan.ts`**: Change workflow step 2 (plan generation)
- **`commands/change-tasks.ts`**: Change workflow step 3 (task breakdown)
- **`commands/agent-sync.ts`**: Multi-agent configuration sync

### Formatters
- **`formatters/error-output.ts`**: Error hierarchy dispatch (ProspecError vs generic)
- **`formatters/init-output.ts`**: Init result with tech stack and agent status
- **`formatters/steering-output.ts`**: Architecture scan output with module relationships
- **`formatters/knowledge-output.ts`**: Knowledge generation summary
- **`formatters/knowledge-init-output.ts`**: Raw scan summary with entry points
- **`formatters/change-story-output.ts`**: Change story creation confirmation
- **`formatters/change-plan-output.ts`**: Plan generation confirmation
- **`formatters/change-tasks-output.ts`**: Task breakdown confirmation
- **`formatters/agent-sync-output.ts`**: Tree-style multi-agent sync output

## Public Interfaces

### Command Registration
All `register*Command` functions accept a `Command` instance and attach subcommands:
- `registerInitCommand(program: Command): void`
- `registerSteeringCommand(program: Command): void`
- `registerKnowledgeCommand(program: Command): Command` (returns command group)
- `registerKnowledgeInitCommand(knowledge: Command, program: Command): void`
- `registerAgentCommand(program: Command): void`
- `registerChangeCommand(program: Command): void`
- `registerChangePlanCommand(program: Command): void`
- `registerChangeTasksCommand(program: Command): void`

### Formatters
All `format*Output` functions accept a result object and LogLevel:
- `formatInitOutput(result: InitResult, logLevel?: LogLevel): void`
- `formatSteeringOutput(result: SteeringResult, logLevel?: LogLevel): void`
- `formatKnowledgeOutput(result: KnowledgeResult, logLevel?: LogLevel): void`
- `formatKnowledgeInitOutput(result: KnowledgeInitResult, logLevel?: LogLevel): void`
- `formatChangeStoryOutput(result: ChangeStoryResult, logLevel?: LogLevel): void`
- `formatChangePlanOutput(result: ChangePlanResult, logLevel?: LogLevel): void`
- `formatChangeTasksOutput(result: ChangeTasksResult, logLevel?: LogLevel): void`
- `formatAgentSyncOutput(result: AgentSyncFullResult, logLevel?: LogLevel): void`

### Error Handling
- `handleError(error: unknown, verbose?: boolean): void` — Unified error dispatcher

### Types
- `GlobalOptions` — Type for global CLI options (`verbose`, `quiet`)

## Dependencies

**Internal**:
- `services/*` — All execute functions for command logic
- `types/errors` — ProspecError hierarchy
- `types/config` — LogLevel type

**External**:
- `commander` — CLI framework
- `@commander-js/extra-typings` — TypeScript support for Commander
- `picocolors` — Terminal color styling

## Design Decisions

### 1. Thin CLI Layer (Parse → Execute → Format)
Commands do NOT contain business logic. They only:
1. Parse options and arguments
2. Call a service's `execute()` function
3. Format the result with a formatter
4. Handle errors with `handleError()`

**Why**: Separation of concerns. CLI is pure I/O orchestration.

### 2. preAction Hook for Config Check
Non-init commands require `.prospec.yaml` to exist. This is enforced via Commander's `preAction` hook in `index.ts`:

```typescript
program.hook('preAction', (_thisCommand, actionCommand) => {
  // Walk up command tree to check if any ancestor is in INIT_COMMANDS
  if (!fs.existsSync('.prospec.yaml')) {
    throw new ConfigNotFound();
  }
});
```

**Why**: Fail fast with clear error message before service execution.

### 3. Command Groups (`change`, `knowledge`)
Related commands are grouped under parent commands:
- `prospec change story|plan|tasks`
- `prospec knowledge init|generate`

**Implementation**: `registerChangeCommand()` creates the parent, `registerChangePlanCommand()` finds it via `program.commands.find()` and attaches subcommand.

**Why**: Logical organization for multi-step workflows.

### 4. Formatter Pattern (Result + LogLevel → stdout)
All formatters follow the same signature:
- Input: `Result` type + `LogLevel` ('quiet' | 'normal' | 'verbose')
- Output: Styled terminal output via `process.stdout.write()`
- Side effect: Sets `process.exitCode` on error

**Why**: Consistent output behavior, easy testing, CI/CD mode support.

### 5. Error Hierarchy Dispatch
`handleError()` distinguishes between:
- `ProspecError` (domain errors with suggestions) → formatted suggestion
- Generic errors → stack trace (verbose only)

**Why**: User-friendly messages for expected failures, debugging info for unexpected ones.

### 6. Global Options via `program.opts()`
Global flags (`--verbose`, `--quiet`) are resolved in each command action via:
```typescript
const globalOpts = program.opts<GlobalOptions>();
const logLevel = resolveLogLevel(globalOpts);
```

**Why**: Type-safe access to global flags without passing them through Commander's type system.
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
