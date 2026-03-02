# types

> Foundational type system — Zod 4 schemas with runtime validation, error hierarchy, and skill/agent definitions (6 files, 459 lines)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/types/config.ts` | ProspecConfigSchema, KnowledgeStrategy, TokenBudget, VALID_AGENTS |
| `src/types/skill.ts` | SKILL_DEFINITIONS (11 skills), AGENT_CONFIGS (4 agents) |
| `src/types/change.ts` | ChangeMetadataSchema, CHANGE_STATUSES |
| `src/types/module-map.ts` | ModuleMapSchema, ModuleEntry, ModuleRelationships |
| `src/types/spec.ts` | FeatureSpecFrontmatterSchema, ProductSpecFrontmatterSchema |
| `src/types/errors.ts` | ProspecError base + 10 specialized error classes |

## Public API

- `ProspecConfigSchema` — Zod schema validating `.prospec.yaml`
- `SKILL_DEFINITIONS` — 11 skill configs with name, type, description, references
- `AGENT_CONFIGS` — 4 agent configs (Claude, Gemini, Copilot, Codex)
- `ChangeMetadataSchema` — Zod schema for change `metadata.yaml`
- `ModuleMapSchema` — Zod schema for `module-map.yaml`
- `ProspecError` — Base error class (code + suggestion fields)
- `KNOWLEDGE_STRATEGIES` — `['auto', 'architecture', 'domain', 'package'] as const`
- `KNOWLEDGE_FILE_TYPES` — `['readme', 'endpoints', 'components', 'screens'] as const`

## Dependencies

- **depends_on**: `zod` only (leaf module — zero internal dependencies)
- **used_by**: ALL other modules import from here

## Modification Guide

1. Adding a new type: Create in the appropriate file, export. Add Zod schema if runtime validation needed.
2. Adding a new error: Extend `ProspecError` in `errors.ts` with `code` (UPPER_SNAKE) and `suggestion`.
3. Adding a new skill: Add entry to `SKILL_DEFINITIONS` in `skill.ts`, then update contract test count in `skill-format.test.ts`.
4. Changing config schema: Update `ProspecConfigSchema` in `config.ts` — use `.optional()` for new fields to avoid breaking existing configs.

## Ripple Effects

- Config schema changes affect `lib/config.ts` validation and all services reading config
- Error type changes affect `cli/formatters/error-output.ts` dispatch logic
- Skill definition changes affect `agent-sync.service.ts` output and contract test assertions
- `KNOWLEDGE_FILE_TYPES` / `KNOWLEDGE_STRATEGIES` changes affect knowledge and steering services

## Pitfalls

- Zod `.optional()` vs `.default()` — optional returns `T | undefined`, default returns `T`. Be explicit.
- Adding required fields to schemas breaks existing `.prospec.yaml` — always use `.optional()` or `.default()`
- `SKILL_DEFINITIONS` count is asserted in `skill-format.test.ts` — adding a skill without updating the test count causes contract test failure

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
