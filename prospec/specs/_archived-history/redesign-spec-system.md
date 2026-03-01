# redesign-spec-system — Archive Summary

- **Archived**: 2026-02-15
- **Original Created**: 2026-02-15
- **Backlog Ref**: BL-015
- **Quality Grade**: A (Good)

## User Story

As a developer using Prospec,
I want `specs/` to be a living behavioral specification that accumulates requirements on every archive, and `proposal.md` to comprehensively express User Scenarios, acceptance criteria, edge cases, and success metrics,
So that specifications truly serve as the source of truth in SDD.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| templates | High | Rewrote `proposal-format.hbs`, added `capability-spec-format.hbs`, updated 4 Skill templates (new-story, archive, plan, verify) |
| services | Low | Archive service output path adjustment (Skill AI handles directory operations directly) |
| types | None | No changes needed — new references fit within existing references/ directory |
| tests | Medium | Contract tests for new format templates, capability spec directory structure verification |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-TEMPLATES-030 | ADDED | Enhanced proposal format reference with INVEST User Stories |
| REQ-TEMPLATES-031 | ADDED | Capability spec format reference template |
| REQ-TEMPLATES-032 | ADDED | prospec-new-story Skill INVEST guidance |
| REQ-TEMPLATES-033 | ADDED | prospec-plan Skill capability spec loading |
| REQ-TEMPLATES-034 | ADDED | prospec-verify Skill spec-knowledge consistency check |
| REQ-SPECS-001 | ADDED | specs/ dual-layer directory structure (capabilities/ + history/) |
| REQ-TEMPLATES-010 | MODIFIED | prospec-archive Skill template: 4→5 phases, added Phase 3.5 Spec Sync |

## Completion

- **Tasks**: 17/17 (100%)
- **Acceptance Criteria**: 9/10 (verify spec↔knowledge cross-validation deferred to BL-014)

## Knowledge Update

The following module documentation may need updating:
- `prospec/ai-knowledge/modules/templates/README.md`
- `prospec/ai-knowledge/modules/services/README.md`
- `prospec/ai-knowledge/modules/tests/README.md`
