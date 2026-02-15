# Coding Conventions: prospec

> Coding standards and best practices for the prospec CLI tool.
> AI Agents reference this document to maintain consistency.

<!-- prospec:auto-start -->
## Language & Runtime

- **Language**: TypeScript 5.9 (strict mode)
- **Runtime**: Node.js (ESM modules)
- **Package Manager**: pnpm

## Project Structure

```
src/
  types/       → Type definitions, Zod schemas, error classes
  lib/         → Shared utilities (stateless functions)
  services/    → Business logic (one service per command)
  cli/         → CLI commands and formatters
  templates/   → Handlebars templates (.hbs files)
tests/
  unit/        → Per-file unit tests (lib/, services/)
  integration/ → Multi-service workflow tests
  contract/    → Template output validation
  e2e/         → Full CLI invocation tests
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `knowledge-update.service.ts` |
| Service files | `{name}.service.ts` | `archive.service.ts` |
| Test files | `{name}.test.ts` | `config.test.ts` |
| Command files | `{name}.ts` in `commands/` | `change-story.ts` |
| Formatter files | `{name}-output.ts` in `formatters/` | `init-output.ts` |
| Types/Interfaces | PascalCase | `ProspecConfig`, `ChangeMetadata` |
| Functions | camelCase | `readConfig`, `detectModules` |
| Constants | UPPER_SNAKE_CASE | `SKILL_DEFINITIONS`, `CHANGE_STATUSES` |
| Error classes | PascalCase + Error | `ConfigNotFound`, `WriteError` |

## Architecture Patterns

### Dependency Direction
```
cli → services → lib → types
```
Never import upward. `types` is the leaf module with zero internal dependencies.

### Service Pattern
Every service exports:
```typescript
export async function execute(options: XxxOptions): Promise<XxxResult>
```

### Command Pattern
Every command exports:
```typescript
export function registerXxxCommand(program: Command): void
```

### Error Pattern
All custom errors extend `ProspecError` with:
- `code`: Machine-readable identifier (UPPER_SNAKE_CASE)
- `suggestion`: Actionable fix for the user

### File Write Pattern
Always use `atomicWrite()` from `lib/fs-utils.ts` — never `fs.writeFileSync()` directly.

### Content Regeneration Pattern
Use `mergeContent()` from `lib/content-merger.ts` when updating files that may have user edits:
```
<!-- prospec:auto-start --> ... <!-- prospec:auto-end -->     ← system overwrites
<!-- prospec:user-start --> ... <!-- prospec:user-end -->     ← preserved
```

## Code Patterns (Follow)

- Use `async/await` instead of `.then()` chains
- Use early returns to reduce nesting
- Prefer `const` over `let`
- Use `type` imports for type-only: `import type { X } from '...'`
- Use `.js` extension in ESM imports: `import { readConfig } from './config.js'`
- Group imports: external → internal (types → lib → services)

## Code Patterns (Avoid)

- Avoid `any` type — use `unknown` or proper generics
- Avoid nested callbacks — use async/await
- Avoid magic numbers — use named constants
- Avoid direct `fs.writeFileSync()` — use `atomicWrite()`
- Avoid importing upward in the dependency chain

## Error Handling

- All custom errors extend `ProspecError` base class
- Every error includes `code` (UPPER_SNAKE_CASE) and `suggestion` (actionable fix)
- Services throw typed errors; CLI layer catches and formats them
- Non-fatal errors in archive workflow use try/catch with logging (don't block main flow)

## Testing Conventions

- Mock `node:fs` and `node:fs/promises` with memfs: `vi.mock('node:fs')`
- Reset virtual filesystem: `vol.reset()` in `afterEach`
- Use `vol.fromJSON()` for test fixture setup
- Follow AAA pattern: Arrange → Act → Assert
- Test file mirrors source: `src/lib/config.ts` → `tests/unit/lib/config.test.ts`
- 4-layer pyramid: unit → integration → contract → e2e

## Template Conventions

- All templates use Handlebars (`.hbs` extension)
- Template variables use `snake_case`: `{{project_name}}`, `{{tech_stack}}`
- Templates accessed only via `lib/template.ts` → `renderTemplate()`
- Include `prospec:auto-start/end` markers for regeneratable files

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`
- No AI attribution in commit messages
- Feature branches with squash merge
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add team-specific conventions, exceptions, or overrides here -->
<!-- prospec:user-end -->
