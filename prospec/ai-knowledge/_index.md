# AI Knowledge Index

> This index helps AI Agents quickly understand the project structure.
> Read this file first, then load specific module READMEs as needed.

## Modules

<!-- prospec:auto-start -->

| Module | Keywords | Status | Description | Rationale | Depends On |
|--------|----------|--------|-------------|-----------|------------|
| **types** | config, schema, errors, skill, change, zod, strategy, spec, token-budget | Active | Zod 4 schemas, error hierarchy (11 classes), skill/agent definitions (6 files, 459 lines) | Leaf module with zero internal deps — all others import from here | — |
| **lib** | fs, config, template, scanner, merger, yaml, logger, detector, module-detector, strategy | Active | Shared utilities — config, file I/O, Handlebars, scanning, 4-mode module detection (10 files, 1,529 lines) | Foundational infrastructure shared across services and CLI | types |
| **services** | init, steering, knowledge, change, archive, agent-sync, spec-sync, product | Active | Business logic — 10 services with `execute()` pattern, including Recipe-First knowledge generation (3,416 lines) | Isolates business logic from I/O layer, enables testability | types, lib |
| **cli** | commands, formatters, commander, output, preaction | Active | CLI entry point — 8 commands + 9 formatters, parse → execute → format (18 files) | Thin I/O layer: no business logic, delegates to services | types, services |
| **templates** | handlebars, hbs, skills, agent-configs, recipe-first, loading-rules, references, change | Active | Handlebars template library — 11 skills, 25 references, 5 change, 5 init/steering/knowledge (57 files) | Pure resources — no logic, consumed by lib/template.ts | — |
| **tests** | vitest, memfs, unit, integration, contract, e2e, knowledge-format, skill-format | Active | 4-layer test suite — 28 files, 440 tests (unit 222 + contract 186 + integration 15 + e2e 17) | Quality gate — validates all layers with pyramid coverage | all |

## Dependency Graph

```
templates ─┐
types ─────┤
           ├── lib ──── services ──── cli
tests (validates all)
```

<!-- prospec:auto-end -->

## Project Info

- **Language**: typescript
- **Knowledge Base**: `prospec/ai-knowledge/`
- **Constitution**: `prospec/CONSTITUTION.md`

## How to Use

1. Start by reading this index to identify related modules
2. Load the specific module's `README.md` for APIs, modification guides, and pitfalls
3. Check `_conventions.md` for coding patterns and standards
4. Consult `CONSTITUTION.md` for architectural constraints
5. Use `module-map.yaml` for dependency relationships

## Loading Rules

| Layer | Content | When to Load | Budget |
|-------|---------|-------------|--------|
| **L0** | `_index.md` + `_conventions.md` | Every conversation (auto-injected via agent config) | ≤ 1,500 tokens total |
| **L1** | `modules/{name}/README.md` | When Skill identifies related modules from L0 keywords | ≤ 400 tokens per module |
| **L2** | Source code files | When Agent needs implementation details | No limit (read on demand) |

**Principles:**
1. L0 answers "where to look" — L1 answers "how to modify" — L2 answers "how to write"
2. Each layer must NOT duplicate information available in a lower layer
3. L1 README is the only file per module — no api-surface.md, dependencies.md, or patterns.md
