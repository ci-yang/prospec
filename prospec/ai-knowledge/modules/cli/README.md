# cli

> Thin CLI orchestration layer — parse args → call service → format output (Commander.js)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | Main entry, program creation, preAction config check |
| `src/cli/commands/init.ts` | `prospec init` — project initialization |
| `src/cli/commands/knowledge-init.ts` | `prospec knowledge init` — scanning and raw-scan |
| `src/cli/commands/change-story.ts` | `prospec change story` — create change proposal |
| `src/cli/commands/change-plan.ts` | `prospec change plan` — generate plan |
| `src/cli/commands/agent-sync.ts` | `prospec agent sync` — multi-agent config sync |
| `src/cli/formatters/error-output.ts` | Error hierarchy dispatch to stderr |
| `src/cli/formatters/init-output.ts` | Init command output formatting |

## Public API

- `createProgram()` — Create Commander.js program with all commands registered
- `main()` — Entry point that creates program and parses argv

## Dependencies

- **depends_on**: `services` (all execute functions), `types` (errors, config)
- **used_by**: None (entry point — user-facing)

## Modification Guide

1. Adding a new command: Create `src/cli/commands/{name}.ts`, register in `index.ts`.
2. Adding a new formatter: Create `src/cli/formatters/{name}-output.ts`, call from command handler.
3. Changing error output: Modify `formatters/error-output.ts` — dispatch by error type.

## Ripple Effects

- New commands need corresponding service + formatter
- `preAction` hook changes affect ALL commands — config check runs before every command
- Error output changes affect E2E test expectations
- Command option changes affect integration test CLI invocations

## Pitfalls

- CLI layer must NOT contain business logic — delegate to services
- Commander.js `.action()` is async — always use `await` and handle errors
- Formatter output goes to stdout (success) or stderr (errors) — don't mix
- E2E tests spawn real CLI — option name changes break them silently

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
