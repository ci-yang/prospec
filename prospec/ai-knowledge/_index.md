# AI Knowledge Index

> This index helps AI Agents quickly understand the project structure.
> Read this file first, then load specific module READMEs as needed.

## Modules

<!-- prospec:auto-start -->

| Module | Keywords | Status | Description | Files | Depends On |
|--------|----------|--------|-------------|-------|------------|
| **types** | config, schema, errors, skill, change, zod | Active | Core type definitions, Zod schemas, error hierarchy, skill/agent constants | readme, api-surface, dependencies, patterns | — |
| **lib** | fs, config, template, scanner, merger, yaml, logger | Active | Shared utilities — file I/O, config, templates, scanning, detection, content merging | readme, api-surface, dependencies, patterns | types |
| **services** | init, steering, knowledge, change, archive, agent-sync | Active | Business logic — one service per CLI command, `execute()` pattern | readme, api-surface, dependencies, patterns | types, lib |
| **cli** | commands, formatters, commander, output | Active | CLI entry point, command registration, output formatters | readme, api-surface, dependencies, patterns | types, services |
| **templates** | handlebars, hbs, init, change, skills, agent-configs, feature-spec, product-spec, proposal-format, INVEST, design-spec, interaction-spec, adapter, pencil, figma, penpot | Active | Handlebars template files for all generated artifacts, including INVEST proposal format, Product-First Feature Spec format, Product Spec format, and Design Phase (visual/interaction specs + platform adapters) | readme, api-surface, dependencies, patterns | — |
| **tests** | vitest, memfs, unit, integration, contract, e2e | Active | 4-layer test suite (27 test files) | readme, api-surface, dependencies, patterns | all |

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

1. Start by reading this index to understand available modules
2. Load the specific module's `README.md` for detailed information
3. Check `_conventions.md` for coding patterns and standards
4. Consult `CONSTITUTION.md` for architectural constraints
5. Use `module-map.yaml` for dependency relationships
