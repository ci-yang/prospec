# agent-sync — Capability Spec

## Overview

The Agent Sync capability detects installed AI CLI tools and generates appropriate configuration files (CLAUDE.md, GEMINI.md, AGENTS.md, skills) so that AI agents can work within the Prospec SDD framework.

**Status**: Active
**Last Updated**: 2026-02-15
**Modules**: services (agent-sync), lib (agent-detector), templates (agent-configs, skills)

## Requirements

### REQ-AGNT-001: Detect Installed CLIs

Auto-detect which AI CLI tools are installed on the system.

**Scenarios:**
- WHEN `~/.claude` exists, THEN detect Claude Code
- WHEN `~/.gemini` exists, THEN detect Gemini CLI
- WHEN `--cli claude` is specified, THEN only process Claude Code

**Added by**: mvp-initial (2026-02-04)

### REQ-AGNT-003: Generate Claude Code CLAUDE.md

Generate a concise CLAUDE.md in project root with AI Knowledge location and Constitution reference.

**Scenarios:**
- WHEN agent sync runs, THEN CLAUDE.md is generated at project root
- WHEN CLAUDE.md content is checked, THEN it contains Knowledge path and available Skills

**Added by**: mvp-initial (2026-02-04)

### REQ-AGNT-004: Generate SDD Skills

Generate skill files for AI agents to follow the SDD workflow.

**Scenarios:**
- WHEN agent sync runs, THEN skill files are generated from .hbs templates
- WHEN skills are deployed, THEN each agent gets appropriate format (SKILL.md, rules, etc.)

**Added by**: mvp-initial (2026-02-04)

### REQ-TYPES-011: Skill Definitions

Define all available skills in SKILL_DEFINITIONS constant.

**Scenarios:**
- WHEN a new skill is added, THEN SKILL_DEFINITIONS is updated
- WHEN agent sync runs, THEN it generates files for all defined skills

**Added by**: add-archive-system (2026-02-09)

## Success Criteria

- **SC-001**: `prospec agent sync` generates correct configs for all detected agents
- **SC-002**: Deployed skills match source .hbs templates after sync

## Change History

| Date | Change | Impact | REQs |
|------|--------|--------|------|
| 2026-02-04 | mvp-initial | Created agent sync workflow for 4 agents | REQ-AGNT-001~005 |
| 2026-02-09 | add-archive-system | Added archive skill to definitions | REQ-TYPES-011 |
| 2026-02-09 | add-knowledge-update | Added knowledge-update skill | REQ-TYPES-010 |
