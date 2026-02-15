# project-init — Capability Spec

## Overview

The Project Init capability handles first-time project setup: creating `.prospec.yaml`, scaffolding directory structure, detecting tech stack, and configuring the base directory for all Prospec artifacts.

**Status**: Active
**Last Updated**: 2026-02-15
**Modules**: services (init), cli (init), lib (config, detector), types (config)

## Requirements

### REQ-INIT-001: Initialize Project Structure

Create all necessary files and directories for a new Prospec project.

**Scenarios:**
- WHEN `prospec init` runs in empty directory, THEN create `.prospec.yaml`, `_index.md`, `_conventions.md`, `CONSTITUTION.md`, `specs/`
- WHEN `.prospec.yaml` already exists, THEN warn and exit without modifying

**Added by**: mvp-initial (2026-02-04)

### REQ-INIT-005: Detect Installed AI CLIs

Identify which AI CLI tools are installed on the system.

**Scenarios:**
- WHEN `~/.claude` exists, THEN report Claude Code detected
- WHEN `~/.gemini` exists, THEN report Gemini CLI detected
- WHEN detection completes, THEN suggest `prospec agent sync`

**Added by**: mvp-initial (2026-02-04)

### REQ-INIT-006: Configurable Project Name

Allow `--name` flag to override auto-detected directory name.

**Scenarios:**
- WHEN `--name` is not specified, THEN use directory name as project name
- WHEN `--name ocelot` is specified, THEN `.prospec.yaml` project.name is `ocelot`

**Added by**: mvp-initial (2026-02-04)

### REQ-TYPES-020: Default Base Directory Constant

Define `DEFAULT_BASE_DIR` constant for configurable artifact namespace.

**Scenarios:**
- WHEN base_dir is not configured, THEN use default value
- WHEN base_dir is configured in `.prospec.yaml`, THEN use configured value

**Added by**: configure-base-dir (2026-02-09)

### REQ-LIB-010: Centralized Path Resolution

`resolveBasePaths()` derives all standard paths (knowledge, constitution, specs) from config.

**Scenarios:**
- WHEN config has paths.base_dir, THEN all paths derive from it
- WHEN config has no paths, THEN fall back to default base directory

**Added by**: configure-base-dir (2026-02-09)

### REQ-CLI-010: Init Prompt for Base Directory

Interactive prompt during `prospec init` to choose base directory.

**Scenarios:**
- WHEN init runs interactively, THEN prompt for base directory choice
- WHEN non-interactive mode, THEN use default base directory

**Added by**: configure-base-dir (2026-02-09)

## Success Criteria

- **SC-001**: New projects are fully functional after a single `prospec init` command
- **SC-002**: All Prospec services use `resolveBasePaths()` for path resolution

## Change History

| Date | Change | Impact | REQs |
|------|--------|--------|------|
| 2026-02-04 | mvp-initial | Created init workflow | REQ-INIT-001~006 |
| 2026-02-09 | configure-base-dir | Configurable base directory | REQ-TYPES-020, REQ-LIB-010, REQ-CLI-010 |
