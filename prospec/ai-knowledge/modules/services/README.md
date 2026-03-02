# services

> Business logic layer — one service per CLI command, each with `execute(options) → Promise<Result>` pattern

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/services/init.service.ts` | Project initialization workflow |
| `src/services/steering.service.ts` | Architecture discovery, module-map + architecture.md generation |
| `src/services/knowledge.service.ts` | Module README + _index.md generation with ContentMerger |
| `src/services/knowledge-init.service.ts` | Initial scan → raw-scan.md generation |
| `src/services/knowledge-update.service.ts` | Incremental knowledge update via delta-spec |
| `src/services/change-story.service.ts` | Create change proposal (proposal.md + metadata.yaml) |
| `src/services/change-plan.service.ts` | Generate implementation plan |
| `src/services/change-tasks.service.ts` | Generate task breakdown |
| `src/services/agent-sync.service.ts` | Sync skills to multi-agent config dirs |
| `src/services/archive.service.ts` | Archive verified changes, sync specs, generate product.md |

## Public API

- `init.execute(options)` — Initialize new project
- `steering.execute(options)` — Discover architecture and generate module map
- `knowledge.execute(options)` — Generate module READMEs and index
- `knowledgeUpdate.execute(options)` — Incremental knowledge update
- `archive.execute(options)` — Archive completed changes

## Dependencies

- **depends_on**: `lib` (scanner, detector, template, config, fs-utils, content-merger, yaml-utils), `types` (all)
- **used_by**: `cli` commands

## Modification Guide

1. Adding a new service: Create `src/services/{name}.service.ts`, export `execute(options): Promise<Result>`.
2. Changing knowledge output: Modify `knowledge.service.ts` templateContext — must match `module-readme.hbs`.
3. Changing steering: Modify `steering.service.ts` — reads `config.knowledge.strategy` for detectModules().
4. Changing archive: Modify `archive.service.ts` — affects spec sync and product.md generation.

## Ripple Effects

- `knowledge.service.ts` template context changes must match `steering/module-readme.hbs` variables
- `steering.service.ts` output (module-map.yaml) consumed by knowledge and knowledge-update services
- `archive.service.ts` writes to `specs/features/` and `specs/product.md` — breaking changes affect verify
- Service result type changes require CLI formatter updates

## Pitfalls

- Always use `atomicWrite()` — direct `fs.writeFileSync` risks partial writes
- `ContentMerger` must be used for existing files — skipping overwrites user notes
- `knowledge.service.ts` reads `module-map.yaml` which must exist — enforce via PrerequisiteError
- Template context keys must match `.hbs` variables — no runtime validation

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
