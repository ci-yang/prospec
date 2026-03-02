# cli

> Thin CLI orchestration layer — parse args → call service → format output (Commander.js, 18 files)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | createProgram(), main(), preAction config check, command registration |
| `src/cli/commands/init.ts` | `prospec init` — project initialization |
| `src/cli/commands/knowledge-init.ts` | `prospec knowledge init` — scan and raw-scan generation |
| `src/cli/commands/change-story.ts` | `prospec change story` — create change proposal |
| `src/cli/commands/change-plan.ts` | `prospec change plan` — generate implementation plan |
| `src/cli/commands/agent-sync.ts` | `prospec agent sync` — multi-agent config deployment |
| `src/cli/formatters/error-output.ts` | handleError() — error type dispatch to stderr |
| `src/cli/formatters/init-output.ts` | formatInitOutput() — init command output |

## Public API

- `createProgram()` — Create Commander.js program with all 8 commands registered
- `main()` — Entry point: create program → parse argv → execute
- `registerXxxCommand(program)` — 8 command registration functions (one per command)
- `formatXxxOutput(result, logLevel)` — 9 formatter functions (stdout for success, stderr for errors)

## Dependencies

- **depends_on**: `services` (all execute functions), `types` (errors, config, LogLevel)
- **used_by**: None (entry point — user-facing)

## Modification Guide

1. Adding a new command: Create `src/cli/commands/{name}.ts` with `registerXxxCommand(program)`, create matching formatter, register in `index.ts`.
2. Adding a formatter: Create `src/cli/formatters/{name}-output.ts` with `formatXxxOutput(result, logLevel)`.
3. Changing error output: Modify `formatters/error-output.ts` — dispatch by error class type.

## Ripple Effects

- New commands need: service (execute), formatter (output), registration (index.ts), E2E test
- `preAction` hook in `index.ts` changes affect ALL commands — config check runs before every command
- Error output format changes affect E2E test expectations
- Command option name changes break E2E tests silently (spawns real CLI)

## Pitfalls

- CLI layer must NOT contain business logic — always delegate to services
- Commander.js `.action()` callbacks are async — always `await` and wrap in try/catch with `handleError()`
- Success output → stdout, error output → stderr — never mix channels
- E2E tests spawn real `npx tsx src/cli/index.ts` — any option/command name change breaks them

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
