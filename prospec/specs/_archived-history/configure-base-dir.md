# configure-base-dir — Archive Summary

- **Archived**: 2026-02-15
- **Original Created**: 2026-02-09
- **Quality Grade**: A (Good)

## User Story

As a developer using Prospec,
I want Prospec artifacts to live under a configurable `prospec/` directory instead of hardcoded `docs/`,
So that Prospec outputs have a clear, branded namespace separate from general project documentation.

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| types | Medium | Added `DEFAULT_BASE_DIR` constant, `base_dir` field to paths schema |
| lib | High | New `resolveBasePaths()` centralized path resolution helper |
| services | High | All 7 services migrated from inline fallbacks to `resolveBasePaths()` |
| cli | Medium | Init command with new interactive prompt for base directory |
| templates | Medium | Dynamic `{{base_dir}}` variable in init templates |
| tests | Medium | Unit tests for resolveBasePaths, updated init service tests |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-TYPES-020 | ADDED | Default base directory constant |
| REQ-LIB-010 | ADDED | Centralized path resolution helper |
| REQ-CLI-010 | ADDED | Init prompt for base directory |
| REQ-SERVICES-020 | MODIFIED | Service path resolution migration (7 services) |
| REQ-TEMPLATES-020 | MODIFIED | Init template variable injection |

## Completion

- **Tasks**: 20/20 (100%)
- **Acceptance Criteria**: 8/8
