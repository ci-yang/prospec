# lib

> Foundational utilities — config management, file I/O, Handlebars templates, scanning, module detection, and logging (10 files, 1,529 lines)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | readConfig(), writeConfig(), resolveBasePaths(), validateConfig() |
| `src/lib/fs-utils.ts` | atomicWrite(), ensureDir(), fileExists() |
| `src/lib/template.ts` | renderTemplate() with built-in Handlebars helpers (eq, contains, join, isoDate, indent) |
| `src/lib/content-merger.ts` | mergeContent() — preserves prospec:user sections on regeneration |
| `src/lib/yaml-utils.ts` | parseYaml(), stringifyYaml(), comment-preserving Document API |
| `src/lib/scanner.ts` | scanDir()/scanDirSync() with fast-glob, built-in security exclusions |
| `src/lib/module-detector.ts` | detectModules() — 4 strategies (auto/architecture/domain/package), 624 lines |
| `src/lib/detector.ts` | detectTechStack() — language, framework, package manager detection |
| `src/lib/agent-detector.ts` | detectAgents() — Claude, Gemini, Copilot, Codex presence check |
| `src/lib/logger.ts` | createLogger() — quiet/normal/verbose with colored symbols |

## Public API

- `readConfig(cwd)` — Read and validate .prospec.yaml with Zod
- `atomicWrite(path, content)` — Write file via temp-then-rename
- `renderTemplate(name, context)` — Render .hbs template by path
- `mergeContent(newContent, existingContent)` — Merge preserving user sections
- `scanDir(patterns, options)` — Scan directory with fast-glob
- `detectModules(files, cwd, strategy)` — Detect modules with configurable strategy
- `detectTechStack(cwd)` — Auto-detect language/framework/package manager

## Dependencies

- **depends_on**: `types` (ProspecConfig, ModuleMap, error classes)
- **used_by**: `services/*`, `cli/*`

## Modification Guide

1. Adding a utility: Create `src/lib/{name}.ts`, export pure stateless functions.
2. Adding a Handlebars helper: Register in `template.ts` via `Handlebars.registerHelper()`.
3. Changing module detection: Modify `module-detector.ts` — update the relevant strategy function (detectByDomain, detectByPackage, detectFromDirectories).
4. Changing config resolution: Modify `config.ts` — update `resolveBasePaths()` return type and all callers.

## Ripple Effects

- `renderTemplate()` changes affect ALL template consumers (every service + CLI formatters)
- `mergeContent()` changes risk overwriting user notes in prospec:user sections
- `detectModules()` signature changes affect `steering.service.ts` (the only consumer)
- `atomicWrite()` changes affect every service that writes files

## Pitfalls

- `mergeContent()` relies on exact marker strings (`<!-- prospec:auto-start -->`) — typos silently fail
- `scanDir()` default exclude list includes sensitive file patterns — custom excludes ADD to defaults, don't replace
- Template partial registration order matters — register partials before templates that reference them
- `detectModules()` reads `module-map.yaml` first — if it exists, strategy parameter is ignored

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
