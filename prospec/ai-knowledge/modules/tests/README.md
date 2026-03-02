# tests

> 4-layer test architecture using Vitest + memfs — unit, integration, contract, and E2E tests

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `tests/unit/lib/config.test.ts` | Config resolution and validation (39 tests) |
| `tests/unit/lib/module-detector.test.ts` | Module detection with strategy tests |
| `tests/unit/services/archive.service.test.ts` | Archive workflow (32 tests) |
| `tests/unit/services/knowledge.service.test.ts` | Knowledge generation with key_exports |
| `tests/unit/services/knowledge-update.service.test.ts` | Incremental knowledge updates |
| `tests/integration/init-flow.test.ts` | Full init workflow |
| `tests/integration/change-flow.test.ts` | Story → Plan → Tasks → Verify flow |
| `tests/contract/skill-format.test.ts` | All skills format validation (136 tests) |
| `tests/contract/knowledge-format.test.ts` | Knowledge output format contract |
| `tests/e2e/cli.test.ts` | Real CLI in tmpdir (15+ tests) |

## Public API

- No public API — test files executed by `vitest run`
- Run: `pnpm test` (all) or `pnpm vitest run tests/unit/` (unit only)

## Dependencies

- **depends_on**: All source modules (testing dependency)
- **used_by**: CI/CD pipeline

## Modification Guide

1. Adding unit tests: Create `tests/unit/{layer}/{name}.test.ts`, use memfs for file system mocking.
2. Adding contract tests: Create `tests/contract/{name}.test.ts`, test output format without mocks.
3. Adding integration tests: Create `tests/integration/{flow}.test.ts`, test multi-service workflows.
4. Mocking pattern: Always `vi.mock('node:fs')` with memfs for file operations.

## Ripple Effects

- Template changes require updating contract test expectations
- Service signature changes require updating unit test mocks
- CLI option changes require updating E2E test invocations
- New skills require adding to contract test skill count assertion

## Pitfalls

- memfs must be reset in `beforeEach(() => vol.reset())` — shared state causes flaky tests
- `vi.mock()` is hoisted — dynamic import paths don't work in mock factory
- Contract tests use real `renderTemplate()` — template syntax errors surface here first
- E2E tests are slow (~1s each) — keep to critical paths only

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
