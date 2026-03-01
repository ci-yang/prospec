# remove-skill-language-directives — Archive Summary

- **Archived**: 2026-03-01
- **Original Created**: 2026-02-26
- **Quality Grade**: A (Good)
- **Backlog Ref**: BL-018

## User Story

As a prospec user with a Traditional Chinese Constitution,
I want skills to contain no hardcoded language directives,
So that the Constitution's language setting is respected without being overridden by skill-level English output directives.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| templates | High | 11 skill .hbs templates: removed `All generated files must be written in English` + simplified Activation directive |
| tests | Medium | Added 33 language neutrality contract tests to skill-format.test.ts |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-SKILL-009 | MODIFIED | Skill output language directive removed — language now determined by Constitution/CLAUDE.md/user preferences |
| REQ-SKILL-010 | MODIFIED | Activation section simplified from `briefly describe in the user's language:` to `briefly describe:` |
| REQ-REF-001 | MODIFIED | Reference format files confirmed language-neutral (no `MUST be written in` directives found outside auto-generated codebase snapshot) |

## Completion

- **Tasks**: 12/12 (100%)
- **Tests**: 383 passed (33 new language neutrality contract tests)
- **Build**: Clean (pnpm test: 27 files, 383 tests, 0 failures)

## Knowledge Update

The following module documentation has been updated:
- `prospec/ai-knowledge/modules/templates/README.md` — "Language Neutrality" section added ✅
- `prospec/ai-knowledge/modules/tests/README.md` — contract test count updated to 136 ✅
