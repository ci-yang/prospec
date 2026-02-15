# MVP Initial — Spec Summary

- **Completed**: 2026-02-04
- **Original Created**: 2026-02-03
- **Quality Grade**: A (Good)
- **Source**: spec-kit-mvp.md (F1-F7) + prospec-design.md

## Overview

Prospec MVP: a CLI tool for Progressive Spec-Driven Development with AI Knowledge integration. Covers 7 Epics, 29 User Stories, 89 Story Points across 5 Sprints.

## User Story

As a developer,
I want a CLI tool that initializes SDD project structure, analyzes existing codebases, generates AI Knowledge, syncs agent configurations, and manages change workflows,
So that I can follow a structured Explore → Story → Plan → Tasks → Implement → Verify development lifecycle.

## Epics

### E0: CLI Foundation (8 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-000 | CLI entry point with `--help` and `--version` | 3 |
| US-001 | `.prospec.yaml` schema definition and validation (Zod) | 2 |
| US-002 | `--verbose` flag support for all commands | 3 |

### E1: Project Initialization — `prospec init` (13 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-100 | Initialize project structure (`.prospec.yaml`, `_index.md`, `_conventions.md`, `CONSTITUTION.md`, `specs/`) | 3 |
| US-101 | Prevent double initialization | 1 |
| US-102 | `--name` flag to specify project name | 2 |
| US-103 | Auto-detect tech stack (package.json, pyproject.toml, etc.) | 3 |
| US-104 | Detect installed AI CLIs (Claude Code, Gemini CLI) | 4 |

### E2: Brownfield Analysis — `prospec steering` (16 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-200 | Recursive directory scanning | 5 |
| US-201 | Tech stack and architecture pattern detection | 3 |
| US-202 | Generate architecture analysis report | 3 |
| US-203 | Build module relationship mapping (`module-map.yaml`) | 5 |

### E3: AI Knowledge Generation — `prospec knowledge generate` (15 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-300 | Read path patterns and scan source code | 3 |
| US-301 | Module detection with steering integration | 3 |
| US-302 | Generate per-module README.md | 5 |
| US-303 | Update module index (`_index.md`) | 4 |

### E4: Agent Configuration Sync — `prospec agent sync` (8 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-400 | Detect installed AI CLIs | 2 |
| US-401 | Generate Claude Code `CLAUDE.md` | 3 |
| US-402 | Generate SDD Skill (`SKILL.md`) | 3 |

### E5: Change Request Definition — `prospec change story` (10 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-500 | Create change directory structure | 2 |
| US-501 | Generate `proposal.md` with User Story template | 3 |
| US-502 | Auto-identify related modules from `_index.md` keywords | 3 |
| US-503 | Generate change `metadata.yaml` with lifecycle tracking | 2 |

### E6: Implementation Plan — `prospec change plan` (11 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-600 | Load proposal and module context (Knowledge + Constitution) | 3 |
| US-601 | Generate structured `plan.md` | 5 |
| US-602 | Generate Patch Spec (`delta-spec.md`) with REQ IDs | 3 |

### E7: Task Breakdown — `prospec change tasks` (8 SP)

| Story | Description | SP |
|-------|-------------|-----|
| US-700 | Break plan into architecture-layered tasks | 3 |
| US-701 | Estimate task complexity (`~{lines} lines`) | 2 |
| US-702 | Checkbox format for progress tracking | 3 |

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| types | High | Config schema, ChangeStatus, Skill definitions, error types |
| lib | High | fs-utils, yaml-utils, detector, scanner, module-detector, config |
| services | High | init, steering, knowledge, knowledge-init, change-story, change-plan, change-tasks, agent-sync |
| cli | High | Commander.js entry point, all subcommands |
| templates | High | Init templates, knowledge templates, skill templates (10 skills), agent configs |
| tests | High | Unit, contract, integration, E2E tests |

## Requirements (REQ ID Cross-Reference)

| Category | REQ IDs |
|----------|---------|
| Init | REQ-INIT-001 ~ 006 |
| Steering | REQ-STEER-001 ~ 006 |
| Knowledge | REQ-KNOW-001 ~ 006 |
| Agent | REQ-AGNT-001 ~ 005 |
| Change | REQ-CHNG-001 ~ 014 |
| CLI | REQ-CLI-001 ~ 004 |

## Completion

- **Epics**: 7/7 (100%)
- **User Stories**: 29/29 (100%)
- **Story Points**: 89/89 (100%)

## Sprint Plan (Actual)

| Sprint | Focus | SP |
|--------|-------|-----|
| Sprint 1 | CLI Foundation + Init | 14 |
| Sprint 2 | Detection Capabilities | 15 |
| Sprint 3 | Knowledge Generation | 14 |
| Sprint 4 | Knowledge + Agent Sync | 17 |
| Sprint 5 | Change Management | 29 |
