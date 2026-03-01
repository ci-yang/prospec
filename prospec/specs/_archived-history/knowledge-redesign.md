# knowledge-redesign — Archive Summary

- **Archived**: 2026-02-15
- **Original Created**: 2026-02-04
- **Quality Grade**: A (Good)

## User Story

As a developer using Prospec across different project types,
I want AI Knowledge module splitting to be decided by AI based on project characteristics,
So that backend APIs, monorepos, SPAs all produce meaningful domain knowledge instead of technical-layer READMEs.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| services | High | New `knowledge-init.service.ts` merging steering + knowledge generate |
| cli | High | New `knowledge init` subcommand, deprecated steering/knowledge generate |
| lib | Low | Reused existing detector.ts and scanner.ts |
| templates | High | New `raw-scan.md.hbs`, simplified `index.md.hbs`, new `prospec-knowledge-generate.hbs` skill + reference |
| types | Medium | New Skill definition for prospec-knowledge-generate |
| tests | High | New unit tests, contract tests, E2E tests for knowledge-init |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| NEW-FILE | ADDED | `src/cli/commands/knowledge-init.ts` |
| NEW-FILE | ADDED | `src/services/knowledge-init.service.ts` |
| NEW-FILE | ADDED | `src/templates/knowledge/raw-scan.md.hbs` |
| NEW-FILE | ADDED | `src/templates/skills/prospec-knowledge-generate.hbs` |
| NEW-FILE | ADDED | `src/templates/skills/references/knowledge-generate-format.hbs` |
| MODIFIED | MODIFIED | `src/types/skill.ts` — added 8th Skill |
| MODIFIED | MODIFIED | `src/cli/commands/knowledge-generate.ts` — deprecated |
| MODIFIED | MODIFIED | `src/cli/commands/steering.ts` — deprecated |
| MODIFIED | MODIFIED | `src/templates/knowledge/index.md.hbs` — simplified |

## Completion

- **Tasks**: 74/74 (100%)
- **Acceptance Criteria**: 10/10
