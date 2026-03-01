# add-archive-system — Archive Summary

- **Archived**: 2026-02-15
- **Original Created**: 2026-02-09
- **Backlog Ref**: BL-001
- **Quality Grade**: A (Good)

## User Story

As a developer using Prospec,
I want to archive completed changes via `/prospec-archive`,
So that `.prospec/changes/` stays clean and the SDD lifecycle is properly closed.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| types | Medium | Added `archived` to ChangeStatus, new Skill definition in SKILL_DEFINITIONS |
| services | High | New `archive.service.ts` with scan, filter, move, summary generation |
| templates | High | New `prospec-archive.hbs` skill template + `archive-format.hbs` reference |
| tests | Medium | Unit tests for archive service + contract tests for new templates |
| lib | Low | Used existing `fs-utils.ts` for file operations |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-TYPES-010 | ADDED | ChangeStatus archived support |
| REQ-TYPES-011 | ADDED | prospec-archive Skill definition |
| REQ-SERVICES-010 | ADDED | Archive Service implementation |
| REQ-TEMPLATES-010 | ADDED | prospec-archive Skill template |
| REQ-TEMPLATES-011 | ADDED | archive-format reference template |
| REQ-TESTS-010 | ADDED | Archive functionality tests |

## Completion

- **Tasks**: 18/18 (100%)
- **Acceptance Criteria**: 10/10
