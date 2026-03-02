# services

> Business logic layer — 10 services following `execute(options) → Promise<Result>` pattern (3,416 lines total)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/services/init.service.ts` | Project initialization — scaffold .prospec.yaml, Constitution, AI Knowledge |
| `src/services/steering.service.ts` | Architecture discovery — scan, detectModules(strategy), generate module-map.yaml |
| `src/services/knowledge.service.ts` | Module README + _index.md generation — Recipe-First format, key_exports, ContentMerger |
| `src/services/knowledge-init.service.ts` | Initial scan → raw-scan.md generation |
| `src/services/knowledge-update.service.ts` | Incremental knowledge update — parseDeltaSpec(), per-module README rebuild |
| `src/services/change-story.service.ts` | Create change proposal (proposal.md + metadata.yaml) |
| `src/services/change-plan.service.ts` | Generate plan.md + delta-spec.md scaffold |
| `src/services/change-tasks.service.ts` | Generate tasks.md scaffold |
| `src/services/agent-sync.service.ts` | Sync skills + references to multi-agent config dirs |
| `src/services/archive.service.ts` | Archive changes, spec sync to Feature Specs, generate product.md (827 lines) |

## Public API

- `init.execute(options)` — Initialize new Prospec project
- `steering.execute(options)` — Discover architecture, generate module-map
- `knowledge.execute(options)` — Generate module READMEs and _index.md
- `knowledgeUpdate.execute(options)` — Incremental delta-spec-driven update
- `archive.execute(options)` — Archive verified changes, sync Feature Specs
- `agentSync.execute(options)` — Deploy skills to .claude/, .gemini/, etc.

## Dependencies

- **depends_on**: `lib` (config, scanner, template, fs-utils, content-merger, yaml-utils, detector, module-detector), `types` (all schemas, errors)
- **used_by**: `cli` commands (each command calls one service)

## Modification Guide

1. Adding a new service: Create `src/services/{name}.service.ts`, export `execute(options): Promise<Result>`. Add matching CLI command + formatter.
2. Changing a service result type: Update the Result interface → update the CLI formatter that consumes it → update unit test assertions.
3. Changing knowledge output: Modify `knowledge.service.ts` — templateContext keys must match `steering/module-readme.hbs` variables (snake_case).
4. Changing steering: Modify `steering.service.ts` — reads `config.knowledge.strategy` for detectModules().
5. Changing archive: Modify `archive.service.ts` — affects spec sync, product.md, and the Knowledge update trigger. Archive calls knowledge-update internally.
6. Inter-service dependencies: `archive` → `knowledge-update` (post-archive trigger), `knowledge` requires `steering` output (module-map.yaml).

## Ripple Effects

- `knowledge.service.ts` template context changes must match `steering/module-readme.hbs` Handlebars variables
- `steering.service.ts` output (module-map.yaml) is consumed by both knowledge and knowledge-update services
- `archive.service.ts` writes to `specs/features/` and `specs/product.md` — changes affect verify and planning skills
- Service result type changes require corresponding CLI formatter updates

## Pitfalls

- Always use `atomicWrite()` — direct `fs.writeFileSync` risks partial writes on crash
- `ContentMerger` must be used for any file with user sections — skipping it silently overwrites user notes
- `knowledge.service.ts` requires `module-map.yaml` to exist — throws `PrerequisiteError` if missing
- Template context keys have no compile-time validation — typos produce empty output silently

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
