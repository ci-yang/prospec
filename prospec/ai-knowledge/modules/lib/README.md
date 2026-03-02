# lib

> Foundational utilities — config management, file I/O, templates, scanning, detection, and logging

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Config read/write/validate with Zod, resolveBasePaths() |
| `src/lib/fs-utils.ts` | atomicWrite(), ensureDir(), fileExists() |
| `src/lib/template.ts` | Handlebars engine with registerHelper/Partial, renderTemplate() |
| `src/lib/content-merger.ts` | mergeContent() — preserves prospec:user sections on regeneration |
| `src/lib/yaml-utils.ts` | parseYaml(), stringifyYaml(), comment-preserving YAML updates |
| `src/lib/scanner.ts` | scanDir() with fast-glob, security exclusions |
| `src/lib/module-detector.ts` | detectModules() with strategy param (auto/architecture/domain/package) |
| `src/lib/detector.ts` | detectTechStack() — language, framework, package manager |
| `src/lib/agent-detector.ts` | detectAgents() — Claude, Gemini, Copilot, Codex detection |
| `src/lib/logger.ts` | Structured logging with quiet/normal/verbose levels |

## Public API

- `readConfig(cwd)` — Read and validate .prospec.yaml
- `atomicWrite(path, content)` — Write file atomically (temp → rename)
- `renderTemplate(name, context)` — Render Handlebars template by name
- `mergeContent(newContent, existingContent)` — Merge preserving user sections
- `scanDir(patterns, options)` — Scan directory with fast-glob
- `detectModules(files, cwd, strategy)` — Detect modules using configurable strategy
- `detectTechStack(cwd)` — Detect language/framework/package manager

## Dependencies

- **depends_on**: `types` (ProspecConfig, ModuleMap, error types)
- **used_by**: `services/*`, `cli/*`

## Modification Guide

1. Adding a utility: Create `src/lib/{name}.ts`, export functions. Keep stateless and pure.
2. Adding a Handlebars helper: Register in `template.ts` via `registerHelper()`.
3. Changing module detection: Modify `module-detector.ts` — update relevant strategy function.
4. Changing config resolution: Modify `config.ts` — update `resolveBasePaths()`.

## Ripple Effects

- `renderTemplate()` changes affect ALL template consumers (services + CLI formatters)
- `mergeContent()` changes affect knowledge generation/updates — risk overwriting user notes
- `detectModules()` signature changes affect `steering.service.ts`
- `atomicWrite()` changes affect every service that writes files

## Pitfalls

- `mergeContent()` relies on exact marker strings — typos silently fail
- `scanDir()` with wrong exclude patterns can expose secrets — always include security defaults
- Template registration order matters — partials before templates that use them
- `detectModules()` loads `module-map.yaml` first and ignores strategy if it exists

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
