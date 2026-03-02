# tests

> 4-layer test architecture using Vitest + memfs — 28 test files, 440 tests (unit, integration, contract, E2E)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `tests/unit/lib/config.test.ts` | Config resolution and validation (16 tests) |
| `tests/unit/lib/module-detector.test.ts` | Module detection with 4 strategy modes (21 tests) |
| `tests/unit/services/archive.service.test.ts` | Archive + spec sync workflow (24 tests) |
| `tests/unit/services/knowledge.service.test.ts` | Knowledge generation with key_exports (7 tests) |
| `tests/unit/services/knowledge-update.service.test.ts` | Incremental knowledge updates (20 tests) |
| `tests/integration/init-flow.test.ts` | Full init → scaffold workflow |
| `tests/integration/change-flow.test.ts` | Story → Plan → Tasks flow |
| `tests/contract/skill-format.test.ts` | All 11 skills format validation (155 tests) |
| `tests/contract/knowledge-format.test.ts` | Knowledge output format contract (17 tests) |
| `tests/e2e/cli.test.ts` | Real CLI in tmpdir (17 tests) |

## Public API

- No public API — test files executed by `vitest run`
- Run: `pnpm test` (all) or `pnpm vitest run tests/unit/` (layer only)

## Dependencies

- **depends_on**: All source modules (testing dependency)
- **used_by**: CI/CD pipeline

## Modification Guide

1. Adding unit tests: Create `tests/unit/{layer}/{name}.test.ts`, mock `node:fs` with memfs.
2. Adding contract tests: Create `tests/contract/{name}.test.ts`, use real `renderTemplate()` — no mocks.
3. Adding integration tests: Create `tests/integration/{flow}.test.ts`, test multi-service workflows with memfs.
4. Adding E2E tests: Add to `tests/e2e/cli.test.ts`, spawn real CLI via `npx tsx src/cli/index.ts`.

## Ripple Effects

- Template changes require updating contract test expectations (skill-format, knowledge-format)
- Service signature changes require updating unit test mocks and assertions
- CLI option/command name changes require updating E2E test invocations
- New skills require adding to `SKILL_DEFINITIONS` count assertion in `skill-format.test.ts`

## Pitfalls

- memfs must be reset in `beforeEach(() => vol.reset())` — shared state between tests causes flaky failures
- `vi.mock()` is hoisted to top of file — dynamic import paths don't work inside mock factory
- Contract tests use real `renderTemplate()` — template syntax errors surface here first, not in unit tests
- E2E tests are slow (~1-3s each) — keep to critical paths only; use contract tests for format validation

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
