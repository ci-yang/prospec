# knowledge-engine — Capability Spec

## Overview

The Knowledge Engine capability manages AI Knowledge: scanning projects, generating module documentation, maintaining the module index, and incrementally updating knowledge when changes are archived.

**Status**: Active
**Last Updated**: 2026-02-15
**Modules**: services (knowledge-init, knowledge-update), lib (scanner, module-detector, detector), templates (knowledge, skills)

## Requirements

### REQ-KNOW-001: Read Path Patterns

Scan source code based on configured path patterns from `.prospec.yaml`.

**Scenarios:**
- WHEN paths are defined in config, THEN only matching files are scanned
- WHEN no paths are defined, THEN default scan rules are used

**Added by**: mvp-initial (2026-02-04)

### REQ-KNOW-003: Module Detection with Steering

Use `module-map.yaml` for module classification when available, fall back to directory-based detection.

**Scenarios:**
- WHEN module-map.yaml exists, THEN use predefined module classifications
- WHEN module-map.yaml is absent, THEN auto-detect modules from directory structure

**Added by**: mvp-initial (2026-02-04)

### REQ-KNOW-004: Generate Module README

Generate per-module README.md with overview, key files, and API descriptions.

**Scenarios:**
- WHEN module is detected, THEN create `ai-knowledge/modules/{name}/README.md`
- WHEN `--dry-run` is specified, THEN only preview output without writing files

**Added by**: mvp-initial (2026-02-04)

### REQ-KNOW-005: Update Module Index

Maintain `_index.md` with module names, keywords, status, and descriptions.

**Scenarios:**
- WHEN modules are generated, THEN `_index.md` reflects all modules
- WHEN module has relationships from module-map, THEN index reflects dependencies

**Added by**: mvp-initial (2026-02-04)

### REQ-SERVICES-020: Delta Spec Parser

Parse delta-spec.md ADDED/MODIFIED/REMOVED sections to identify affected modules.

**Scenarios:**
- WHEN delta-spec.md contains REQ IDs, THEN extract module names from REQ-{MODULE}-{NNN} pattern
- WHEN ADDED section has new requirements, THEN identify modules needing new documentation

**Added by**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-021: Incremental Module Update

Update only affected module documentation instead of full regeneration.

**Scenarios:**
- WHEN module is affected by ADDED, THEN create or update module README.md
- WHEN module is affected by REMOVED, THEN mark module as removed (not delete)

**Added by**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-022: Index and Module Map Update

Update _index.md and module-map.yaml after incremental changes.

**Scenarios:**
- WHEN modules are updated, THEN _index.md reflects current state
- WHEN new module is added, THEN module-map.yaml includes new entry

**Added by**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-023: Knowledge Update Orchestrator

Execute the full incremental update flow: parse delta-spec → scan → update modules → update index.

**Scenarios:**
- WHEN knowledge-update is triggered, THEN all steps execute in order
- WHEN triggered from archive, THEN failure is non-fatal

**Added by**: add-knowledge-update (2026-02-09)

## Edge Cases

- No delta-spec.md available: allow manual module specification
- Module README has user-maintained sections: preserve during update
- Knowledge update fails during archive: non-fatal, suggest manual run

## Success Criteria

- **SC-001**: Incremental updates only touch affected modules (not full regen)
- **SC-002**: _index.md and module-map.yaml stay consistent with module directories

## Change History

| Date | Change | Impact | REQs |
|------|--------|--------|------|
| 2026-02-04 | mvp-initial | Created knowledge generation pipeline | REQ-KNOW-001~005 |
| 2026-02-04 | knowledge-redesign | AI-driven module splitting, merged steering+knowledge | REQ-KNOW-003~005 |
| 2026-02-09 | add-knowledge-update | Incremental delta-spec-driven updates | REQ-SERVICES-020~023 |
