# AI Knowledge Index

> This index helps AI Agents quickly understand the project structure.
> Read this file first, then load specific module READMEs as needed.

## Modules

<!-- prospec:auto-start -->

| Module | Keywords | Status | Description | Rationale | Depends On |
|--------|----------|--------|-------------|-----------|------------|
| **types** | config, schema, errors, skill, change, zod, strategy | Active | Core type definitions, Zod schemas, error hierarchy, skill/agent constants | Leaf module with zero internal deps — all others import from here | — |
| **lib** | fs, config, template, scanner, merger, yaml, logger, detector | Active | Shared utilities — file I/O, config, templates, scanning, detection, content merging | Foundational infrastructure shared across services and CLI | types |
| **services** | init, steering, knowledge, change, archive, agent-sync | Active | Business logic — one service per CLI command, `execute()` pattern | Isolates business logic from I/O layer, enables testability | types, lib |
| **cli** | commands, formatters, commander, output | Active | CLI entry point, command registration, output formatters | Thin I/O layer: parse → execute → format | types, services |
| **templates** | handlebars, hbs, skills, agent-configs, recipe-first, loading-rules | Active | Handlebars template files for all generated artifacts (57 files) | Pure resources — no logic, consumed by lib/template.ts | — |
| **tests** | vitest, memfs, unit, integration, contract, e2e | Active | 4-layer test suite (28 test files, 440+ tests) | Quality gate — validates all layers | all |

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
