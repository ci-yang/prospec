# Prospec Constitution

## Core Principles

### I. Progressive Disclosure First
Every feature must respect context window limits:
- AI Knowledge uses 3-layer loading: index → README → details
- Skills use metadata (~100 words) → body (<5k words) → resources
- Target 70-80% token savings compared to full-context loading
- Never load all modules at once; use keywords to identify relevant modules

### II. Clean Architecture (NON-NEGOTIABLE)
Strict separation of concerns:
```
src/
├── cli/        → Commander commands (entry points only)
├── core/       → Business logic (pure functions, no I/O)
├── adapters/   → External integrations (file system, AI APIs)
└── types/      → Zod schemas + TypeScript types
```
- MUST NOT put business logic in CLI layer
- MUST NOT put I/O operations in core layer
- Each layer only depends on layers below it

### III. Hybrid Architecture (CLI + Skills)
Clear separation between CLI and Skills:
- **CLI commands** (`src/commands/`): Bootstrap operations that don't require AI
  - `prospec init` - must work without Claude Code
  - File system operations, config management
- **Skills** (`skills/`): AI-assisted workflows
  - `prospec-steering`, `prospec-knowledge`, `prospec-story`, etc.
  - Require Claude Code environment
  - Follow skill-creator best practices

### IV. Schema-First Development
All data structures defined with Zod before implementation:
- Define schema in `shared/types/` first
- Use `z.infer<typeof Schema>` for TypeScript types
- Validate all external inputs (CLI args, config files, user input)
- Use `.strict()` to reject unknown properties

### V. Test-Driven Quality
Testing requirements:
- Unit tests for all core/ logic (Vitest)
- Integration tests for CLI commands
- Test files named `test_<module>.ts`
- Minimum 80% coverage for core/ modules

## Technical Constraints

### Technology Stack (MUST USE)
```
Runtime:        Bun (preferred) or Node.js 20+
Language:       TypeScript 5.0+
CLI Framework:  Commander.js
Validation:     Zod
Config Format:  YAML
Doc Format:     Markdown
Template:       Handlebars
Testing:        Vitest
```

### Forbidden Patterns
```
MUST NOT hardcode file paths (use config)
MUST NOT use any/unknown types (use Zod inference)
MUST NOT skip error handling (wrap all I/O in try-catch)
MUST NOT commit secrets or credentials
MUST NOT use synchronous file operations (use async/await)
```

## CLI Design Standards

### Command Structure
```
prospec <resource> <action> [options]

Examples:
  prospec init [path]
  prospec knowledge generate
  prospec change story <name>
  prospec agent sync --cli claude
```

### Required for All Commands
- `--help` flag with usage examples
- `--verbose` flag for debug output
- Meaningful error messages with suggestions
- Exit codes: 0 (success), 1 (error), 2 (invalid usage)

### Output Standards
- Use colors sparingly (support `NO_COLOR` env)
- Progress indicators for long operations
- Summary at end of successful operations
- JSON output option for programmatic use (`--json`)

## File Structure Standards

### Project Initialization Output
```
project/
├── .prospec.yaml              # Project configuration
├── AGENTS.md                  # Universal agent instructions
└── docs/
    ├── ai-knowledge/
    │   ├── _index.md          # Module index with keywords
    │   └── _conventions.md    # Development conventions
    ├── CONSTITUTION.md        # Project rules
    └── specs/                 # Spec documents
```

### Change Directory Structure
```
.prospec/changes/{change-name}/
├── proposal.md        # User Story
├── plan.md            # Implementation plan
├── delta-spec.md      # Patch Spec (ADDED/MODIFIED/REMOVED)
├── tasks.md           # Task breakdown
└── metadata.yaml      # Change metadata
```

## Governance

- Constitution supersedes all other coding practices
- All PRs must verify compliance with these principles
- Amendments require: documentation update, team approval, migration plan
- Use DEVELOPMENT_GUIDE.md for implementation guidance

**Version**: 1.0.0 | **Ratified**: 2026-02-03 | **Last Amended**: 2026-02-03
