# cli-infra — Capability Spec

## Overview

The CLI Infrastructure capability provides the foundational CLI framework, configuration schema, type definitions, error handling, and shared utilities that all other capabilities depend on.

**Status**: Active
**Last Updated**: 2026-02-15
**Modules**: cli (entry point), types (config, change, errors, skill), lib (fs-utils, yaml-utils, config)

## Requirements

### REQ-CLI-001: CLI Entry Point

Provide `prospec` command with `--help`, `--version`, and subcommand routing.

**Scenarios:**
- WHEN `prospec --help` is run, THEN display all available commands
- WHEN `prospec --version` is run, THEN display version number
- WHEN invalid command is entered, THEN show error and suggest similar commands

**Added by**: mvp-initial (2026-02-04)

### REQ-CLI-004: Verbose Mode

All commands support `--verbose` flag for detailed output.

**Scenarios:**
- WHEN `--verbose` is added, THEN output detailed step-by-step information
- WHEN not specified, THEN output only result summary

**Added by**: mvp-initial (2026-02-04)

### REQ-CONFIG-001: Config Schema Validation

`.prospec.yaml` is validated against Zod schema on load.

**Scenarios:**
- WHEN config is valid, THEN all fields parse successfully
- WHEN `project.name` is missing, THEN throw ConfigInvalid with descriptive message
- WHEN unknown fields exist, THEN warn but do not block

**Added by**: mvp-initial (2026-02-04)

## Success Criteria

- **SC-001**: All CLI commands are discoverable via `--help`
- **SC-002**: Config validation catches malformed `.prospec.yaml` with actionable messages

## Change History

| Date | Change | Impact | REQs |
|------|--------|--------|------|
| 2026-02-04 | mvp-initial | Created CLI framework and config system | REQ-CLI-001~004, REQ-CONFIG-001 |
| 2026-02-09 | configure-base-dir | Added base_dir to config paths schema | REQ-CONFIG-001 |
