# Tests Module

> Comprehensive 4-layer test suite for prospec CLI using Vitest and memfs virtual filesystem

<!-- prospec:auto-start -->

## Overview

The `tests/` module implements a **4-layer test architecture** ensuring coverage from isolated units to full end-to-end CLI workflows. All tests except E2E use **memfs** virtual filesystem for fast, isolated execution without disk I/O.

## Test Architecture

```
tests/
├── unit/              # Layer 1: Isolated component tests
│   ├── lib/           # Utilities (config, scanner, template, etc.)
│   └── services/      # Business logic (change-*, knowledge-*, archive)
├── integration/       # Layer 2: Multi-component workflows
│   ├── init-flow.test.ts
│   ├── change-flow.test.ts
│   ├── steering-flow.test.ts
│   └── skill-generation.test.ts
├── contract/          # Layer 3: API/format contracts
│   ├── skill-format.test.ts
│   └── cli-output.test.ts
└── e2e/               # Layer 4: Real CLI in tmpdir
    └── cli.test.ts
```

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner, assertions, coverage (v8) |
| **memfs** | Virtual in-memory filesystem for unit/integration tests |
| **@inquirer/prompts** | CLI prompts (mocked in tests) |
| **node:child_process** | E2E: spawn real CLI process |

## Key Test Files by Layer

### Layer 1: Unit Tests

| File | Tests | Purpose |
|------|-------|---------|
| `unit/lib/config.test.ts` | 39 tests | Config resolution, validation, read/write |
| `unit/lib/template.test.ts` | 7 tests | Handlebars template rendering |
| `unit/lib/scanner.test.ts` | ~15 tests | File/directory scanning logic |
| `unit/lib/yaml-utils.test.ts` | ~10 tests | YAML parsing, frontmatter extraction |
| `unit/services/archive.service.test.ts` | 32 tests | Archive workflow (scan, filter, move, summarize) |
| `unit/services/change-story.service.test.ts` | ~20 tests | Story creation, metadata management |
| `unit/services/knowledge.service.test.ts` | ~25 tests | Knowledge generation and updates |

### Layer 2: Integration Tests

| File | Tests | Purpose |
|------|-------|---------|
| `integration/init-flow.test.ts` | 3 tests | Full init workflow: config + dirs + templates |
| `integration/change-flow.test.ts` | ~8 tests | Story → Plan → Tasks → Verify flow |
| `integration/steering-flow.test.ts` | ~5 tests | Steering detection and raw-scan generation |
| `integration/skill-generation.test.ts` | ~6 tests | Skill template rendering for all agents |

### Layer 3: Contract Tests

| File | Tests | Purpose |
|------|-------|---------|
| `contract/skill-format.test.ts` | 70+ tests | Validates 10 skills, 10 reference templates, proposal-format structure (8+ sections, INVEST/WHEN-THEN), capability-spec-format structure, 4 agent configs |
| `contract/cli-output.test.ts` | ~10 tests | CLI stdout/stderr format contracts |

### Layer 4: E2E Tests

| File | Tests | Purpose |
|------|-------|---------|
| `e2e/cli.test.ts` | 15+ tests | Real CLI execution in tmpdir (init, steering, change, knowledge, agent) |

## Design Decisions

### Why memfs?

- **Speed**: ~100x faster than real disk I/O
- **Isolation**: Each test gets a clean filesystem (via `vol.reset()`)
- **Parallelization**: No file locking or race conditions
- **Determinism**: No leftover artifacts from previous runs

### Why ESM mocking with vi.mock?

```typescript
vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
```

- Vitest ESM mocking requires async factory
- Spread operator ensures all fs methods are replaced
- `default` export needed for default imports

### Why 4 layers?

1. **Unit**: Fast feedback, high coverage (~80%+)
2. **Integration**: Verify cross-component communication
3. **Contract**: Enforce API stability (prevents breaking changes)
4. **E2E**: Validate real-world CLI usage (catches build/distribution issues)

## Test Coverage

Vitest v8 coverage target:
- **Include**: `src/**/*.ts`
- **Exclude**: `src/templates/**` (templates validated via contract tests)
- **Target**: 80%+ line coverage

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
