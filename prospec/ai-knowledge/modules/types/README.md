# types

> Foundational type system — Zod schemas with type inference, error hierarchy, and skill definitions

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/types/config.ts` | ProspecConfigSchema, TechStack, LogLevel, VALID_AGENTS, KNOWLEDGE_FILE_TYPES, KnowledgeStrategy |
| `src/types/skill.ts` | SKILL_DEFINITIONS (11 skills), AGENT_CONFIGS (4 agents), SkillConfig, AgentConfig |
| `src/types/change.ts` | ChangeMetadataSchema, ChangeStatus, CHANGE_STATUSES |
| `src/types/module-map.ts` | ModuleMapSchema, ModuleEntry, ModuleRelationships |
| `src/types/spec.ts` | FeatureSpecFrontmatterSchema, ProductSpecFrontmatterSchema |
| `src/types/errors.ts` | ProspecError base + 10 specialized error types |

## Public API

- `ProspecConfigSchema` — Zod schema for `.prospec.yaml` validation
- `SKILL_DEFINITIONS` — Array of all 11 skill definitions with metadata
- `AGENT_CONFIGS` — Array of 4 agent config definitions (Claude, Gemini, Copilot, Codex)
- `ChangeMetadataSchema` — Zod schema for change metadata.yaml
- `ModuleMapSchema` — Zod schema for module-map.yaml
- `ProspecError` — Base error class for all prospec errors
- `KNOWLEDGE_STRATEGIES` — Const array: auto, architecture, domain, package
- `KNOWLEDGE_FILE_TYPES` — Const array: readme, endpoints, components, screens

## Dependencies

- **depends_on**: `zod` only (leaf module — no internal dependencies)
- **used_by**: ALL other modules (foundational)

## Modification Guide

1. Adding a new type: Create in appropriate file, export. Add Zod schema if runtime validation needed.
2. Adding a new error: Extend `ProspecError` in `errors.ts`.
3. Adding a new skill: Add entry to `SKILL_DEFINITIONS` in `skill.ts`, update contract test count.
4. Changing config schema: Update `ProspecConfigSchema` — affects all config consumers.

## Ripple Effects

- Config schema changes affect `lib/config.ts` validation and all services reading config
- Error type changes affect `cli/formatters/error-output.ts` dispatch
- Skill definition changes affect `agent-sync.service.ts` and contract tests
- `KNOWLEDGE_FILE_TYPES` changes affect `knowledge.service.ts` and `knowledge-init.service.ts`

## Pitfalls

- Zod `.optional()` vs `.default()` — optional returns `undefined`, default returns value. Be explicit.
- Adding required fields to schemas breaks existing `.prospec.yaml` — always use `.optional()`
- `SKILL_DEFINITIONS` order matters for contract tests — new skills update `skill-format.test.ts`

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
