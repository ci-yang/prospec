# lib Module

> Shared utility functions and core infrastructure for the Prospec CLI

<!-- prospec:auto-start -->

## Overview

The `lib` module provides foundational utilities, infrastructure, and low-level services used throughout the Prospec CLI. It handles configuration management, file system operations, template rendering, content merging, YAML processing, scanning, detection, and logging.

## Responsibilities

- **Configuration Management**: Read, validate, and write `.prospec.yaml` configuration files with schema validation
- **File System Operations**: Atomic writes, directory creation, and existence checks
- **Template Rendering**: Handlebars-based template engine with custom helpers and partials
- **Content Merging**: Preserve user-written sections during regeneration using prospec markers
- **YAML Processing**: Comment-preserving YAML parsing and stringification
- **Directory Scanning**: Security-first file system scanning with exclusion patterns
- **Tech Stack Detection**: Identify project language, framework, and package manager
- **Module Detection**: Five-step algorithm for discovering project modules and architecture
- **Agent Detection**: Detect installed AI CLI tools (Claude, Gemini, Copilot, Codex)
- **Structured Logging**: Multi-level logger with symbols and colors

## Key Files

| File | Purpose | Exports |
|------|---------|---------|
| `config.ts` | Configuration file management | `readConfig`, `writeConfig`, `validateConfig`, `resolveBasePaths`, `resolveConfigPath` |
| `fs-utils.ts` | File system utilities | `atomicWrite`, `ensureDir`, `fileExists` |
| `template.ts` | Handlebars template engine | `renderTemplate`, `registerHelper`, `registerPartial`, `registerPartialFromFile` |
| `content-merger.ts` | User/auto section preservation | `mergeContent`, `parseSections`, `extractUserSections` |
| `yaml-utils.ts` | Comment-preserving YAML operations | `parseYaml`, `stringifyYaml`, `parseYamlDocument`, `stringifyYamlDocument` |
| `scanner.ts` | Directory scanning with security | `scanDir`, `scanDirSync` |
| `detector.ts` | Tech stack detection | `detectTechStack` |
| `module-detector.ts` | Module and architecture detection | `detectModules` |
| `agent-detector.ts` | AI CLI tool detection | `detectAgents` |
| `logger.ts` | Structured logging | `createLogger` |

## Public API Summary

### Configuration
- `readConfig(cwd?)`: Read and validate `.prospec.yaml`
- `writeConfig(config, cwd?)`: Write config with comment preservation
- `validateConfig(rawYaml, sourcePath?)`: Validate YAML against schema
- `resolveBasePaths(config, cwd)`: Derive standard paths from config
- `resolveConfigPath(cwd?)`: Resolve config file path

### File System
- `atomicWrite(filePath, content)`: Write file atomically to prevent corruption
- `ensureDir(dirPath)`: Create directory recursively
- `fileExists(filePath)`: Synchronous existence check

### Templates
- `renderTemplate(templatePath, context)`: Render Handlebars template
- `registerHelper(name, fn)`: Register custom Handlebars helper
- `registerPartial(name, content)`: Register reusable partial
- `registerPartialFromFile(name, templatePath)`: Register partial from file

### Content Merging
- `mergeContent(newContent, existingContent)`: Merge while preserving user sections
- `parseSections(content)`: Parse into auto/user/static sections
- `extractUserSections(content)`: Extract user-written sections only

### YAML
- `parseYaml<T>(content, sourcePath?)`: Parse YAML to JavaScript
- `stringifyYaml(value, options?)`: Stringify JavaScript to YAML
- `parseYamlDocument(content, sourcePath?)`: Parse with comment preservation
- `stringifyYamlDocument(doc)`: Stringify Document with comments

### Scanning
- `scanDir(patterns, options?)`: Async glob-based directory scan
- `scanDirSync(patterns, options?)`: Sync variant

### Detection
- `detectTechStack(cwd?)`: Detect language, framework, package manager
- `detectModules(files, cwd)`: Five-step module detection algorithm
- `detectAgents()`: Detect installed AI CLI tools

### Logging
- `createLogger(level?)`: Create logger with quiet/normal/verbose modes

## Dependencies

### External
- **zod**: Schema validation for configuration
- **fast-glob**: High-performance directory scanning
- **handlebars**: Template rendering engine
- **picocolors**: Terminal colors (TTY-aware)
- **yaml**: Comment-preserving YAML processing

### Internal
- **types**: `ProspecConfig`, `ProspecConfigSchema`, `ModuleMap`, error types

## Design Decisions

1. **Atomic Writes**: All file writes use atomic write-then-rename to prevent corruption
2. **Content Preservation**: Prospec markers enable safe regeneration while preserving user edits
3. **Singleton Template Engine**: Handlebars instance initialized once with helpers and partials
4. **Security-First Scanning**: Default exclusion of sensitive patterns (`.env`, `*credential*`, `*secret*`)
5. **Comment Preservation**: YAML Document API used for metadata round-trips
6. **Five-Step Module Detection**: Prioritizes `module-map.yaml` → directories → architecture → keywords → conflict resolution
7. **Structured Logging**: Three-level output (quiet/normal/verbose) with Unicode symbols

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
