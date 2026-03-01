# refactor-skill-token-efficiency — Archive Summary

- **Archived**: 2026-02-15
- **Original Created**: 2026-02-06
- **Quality Grade**: A (Good)

## User Story

As a AI Agent using prospec Skills,
I want each SKILL.md compressed to under 200 lines, redundant tutorial content removed, NEVER anti-pattern lists added, and all SKILL.md written in English,
So that loading Skills consumes fewer tokens, provides more precise expert guidance, and is usable by developers worldwide.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| templates | High | All 8 skill templates rewritten (81% compression: ~5,188 → ~1,004 lines) |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-SKILL-001 | MODIFIED | prospec-explore.hbs compression + English (300→84 lines) |
| REQ-SKILL-002 | MODIFIED | prospec-new-story.hbs compression + English (507→92 lines) |
| REQ-SKILL-003 | MODIFIED | prospec-plan.hbs compression + English (803→94 lines) |
| REQ-SKILL-004 | MODIFIED | prospec-tasks.hbs compression + English (779→85 lines) |
| REQ-SKILL-005 | MODIFIED | prospec-ff.hbs compression + English (728→105 lines) |
| REQ-SKILL-006 | MODIFIED | prospec-implement.hbs compression + English (896→92 lines) |
| REQ-SKILL-007 | MODIFIED | prospec-verify.hbs compression + English (916→112 lines) |
| REQ-SKILL-008 | MODIFIED | prospec-knowledge-generate.hbs optimization + English (260→146 lines) |
| REQ-SKILL-009 | ADDED | English output instruction in every SKILL.md |
| REQ-SKILL-010 | ADDED | Activation section for user-facing flow description |

## Completion

- **Tasks**: 15/15 (100%)
- **Acceptance Criteria**: 10/10

## Knowledge Update

The following module documentation may need updating:
- `prospec/ai-knowledge/modules/templates/README.md`
