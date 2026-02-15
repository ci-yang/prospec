# change-workflow — Capability Spec

## Overview

The Change Workflow capability manages the full SDD lifecycle for individual changes: creating proposals (story), generating implementation plans (plan), breaking plans into tasks, implementing, verifying, and archiving completed work.

**Status**: Active
**Last Updated**: 2026-02-15
**Modules**: services (archive, change-story, change-plan, change-tasks), templates (skills), types (change)

## Requirements

### REQ-CHNG-001: Create Change Directory

Create `.prospec/changes/{name}/` with `metadata.yaml` (status: story) when a new change is initiated.

**Scenarios:**
- WHEN user runs `prospec change story <name>`, THEN create directory structure with metadata.yaml
- WHEN change directory already exists, THEN prompt user that change exists

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-002: Generate proposal.md

Generate proposal.md with User Story format (As a / I want / So that) and acceptance criteria.

**Scenarios:**
- WHEN change story completes, THEN proposal.md contains User Story format
- WHEN `--description` is provided, THEN description is written to Notes section

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-003: Auto-identify Related Modules

Match change name and description against `_index.md` keywords to identify related modules.

**Scenarios:**
- WHEN change name contains module keyword, THEN Related Modules section lists matching modules
- WHEN no keywords match, THEN Related Modules section is empty

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-004: Change Metadata Lifecycle

Track change status through lifecycle phases via metadata.yaml.

**Scenarios:**
- WHEN change story is created, THEN metadata.yaml has status: story
- WHEN plan is generated, THEN status updates to plan
- WHEN tasks are generated, THEN status updates to tasks

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-006: Load Proposal and Module Context

Read proposal.md and load related module AI Knowledge for plan generation.

**Scenarios:**
- WHEN change plan starts, THEN proposal.md and related module READMEs are loaded
- WHEN Constitution exists, THEN it is injected as context

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-009: Generate plan.md

Generate structured implementation plan with overview, affected modules, steps, and risks.

**Scenarios:**
- WHEN context is loaded, THEN plan.md contains overview, affected modules, implementation steps, risk assessment
- WHEN plan has more than 10 steps, THEN scope is too large — suggest splitting

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-010: Generate delta-spec.md

Generate Patch Spec with ADDED/MODIFIED/REMOVED format and REQ IDs.

**Scenarios:**
- WHEN plan is generated, THEN delta-spec.md is created alongside
- WHEN requirements are listed, THEN each has REQ-{MODULE}-{NUMBER} format

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-011: Break Plan into Tasks

Generate tasks.md with architecture-layered task breakdown.

**Scenarios:**
- WHEN plan.md is valid, THEN tasks.md groups tasks by architecture layer (Types → Lib → Services → CLI → Tests)
- WHEN task is parallelizable, THEN it is marked with [P]

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-013: Estimate Task Complexity

Each task includes estimated lines of code.

**Scenarios:**
- WHEN tasks are generated, THEN each includes `~{lines} lines` estimate
- WHEN summary is displayed, THEN total task count and total estimated lines are shown

**Added by**: mvp-initial (2026-02-04)

### REQ-CHNG-014: Executable Task Format

Tasks use checkbox format for progress tracking.

**Scenarios:**
- WHEN tasks.md is generated, THEN each task starts with `- [ ]`
- WHEN task is completed, THEN it is marked `- [x]`

**Added by**: mvp-initial (2026-02-04)

### REQ-TYPES-010: ChangeStatus Archived Support

Added `archived` to ChangeStatus type for completed change lifecycle.

**Scenarios:**
- WHEN change is archived, THEN metadata status is set to `archived`
- WHEN filtering changes, THEN `archived` status is a valid filter value

**Added by**: add-archive-system (2026-02-09)

### REQ-SERVICES-010: Archive Service

Scan, filter, move, and generate summaries for completed changes.

**Scenarios:**
- WHEN archive is executed, THEN verified changes are moved to `.prospec/archive/{date}-{name}/`
- WHEN summary is generated, THEN it contains User Story, REQ IDs, affected modules, completion stats
- WHEN archive completes, THEN summary is copied to `specs/history/` for version control

**Added by**: add-archive-system (2026-02-09)

### REQ-TEMPLATES-010: Archive Skill Template

Skill template for the archive workflow with 5 execution phases.

**Scenarios:**
- WHEN archive skill is triggered, THEN it follows Scan → Summary → Archive → Spec Sync → Knowledge Update
- WHEN spec sync fails, THEN archiving still succeeds (non-fatal)

**Added by**: add-archive-system (2026-02-09)
**Modified by**: redesign-spec-system (2026-02-15) — added Phase 3.5 Spec Sync, summary output to specs/history/

## Edge Cases

- Archive directory already exists: warn user, ask to overwrite or skip
- Change missing delta-spec.md: archive with partial summary
- Knowledge update failure: non-fatal, suggest manual update

## Success Criteria

- **SC-001**: All SDD lifecycle stages (story → plan → tasks → implement → verify → archive) produce correctly formatted artifacts
- **SC-002**: Archive summaries accumulate in specs/history/ for version-controlled audit trail

## Change History

| Date | Change | Impact | REQs |
|------|--------|--------|------|
| 2026-02-04 | mvp-initial | Created change management workflow | REQ-CHNG-001~014 |
| 2026-02-04 | skill-autonomy | Skills autonomously create change directories | REQ-CHNG-001 |
| 2026-02-09 | add-archive-system | Added archive lifecycle stage | REQ-TYPES-010, REQ-SERVICES-010, REQ-TEMPLATES-010 |
| 2026-02-15 | redesign-spec-system | Archive outputs to specs/history/, added Phase 3.5 Spec Sync | REQ-TEMPLATES-010 |
