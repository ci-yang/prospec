# Tests Module: Dependencies

> Testing dependencies and configuration

<!-- prospec:auto-start -->

## External Dependencies

### Testing Framework

```json
{
  "vitest": "^2.0.0"
}
```

**Purpose**: Test runner, assertions, coverage provider

**Key Features**:
- ESM-first test runner (native TypeScript support)
- Compatible with Vite ecosystem
- Built-in coverage via v8
- Fast parallel execution
- Watch mode for rapid development

### Virtual Filesystem

```json
{
  "memfs": "^4.0.0"
}
```

**Purpose**: In-memory filesystem for unit/integration tests

**Why memfs?**
- **Performance**: ~100x faster than real disk I/O
- **Isolation**: Each test gets clean slate via `vol.reset()`
- **Determinism**: No leftover files from previous runs
- **Parallelization**: No file locking or race conditions

**Usage Pattern**:
```typescript
import { vol } from 'memfs';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset(); // Reset virtual filesystem
});

vol.fromJSON({
  '/project/file.txt': 'content',
});
```

### CLI Prompts (Mocked)

```json
{
  "@inquirer/prompts": "^7.0.0"
}
```

**Purpose**: CLI prompts for user input (mocked in tests)

**Mocking Pattern**:
```typescript
vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['claude']),
  input: vi.fn().mockResolvedValue('prospec'),
  Separator: class Separator {
    constructor(public text?: string) {}
  },
}));
```

### Node.js Built-ins

- `node:fs` — Mocked with memfs in unit/integration tests
- `node:fs/promises` — Async filesystem operations
- `node:path` — Path manipulation
- `node:os` — OS utilities (homedir, tmpdir)
- `node:child_process` — E2E: spawn real CLI process
- `node:util` — promisify for async child_process

## Internal Dependencies

Tests import **all** production modules under `src/`:

### From `src/lib/`

```typescript
import { resolveConfigPath, readConfig, validateConfig } from '../../../src/lib/config.js';
import { renderTemplate } from '../../../src/lib/template.js';
import { scanDirectory } from '../../../src/lib/scanner.js';
import { parseYaml, stringifyYaml } from '../../../src/lib/yaml-utils.js';
import { logger } from '../../../src/lib/logger.js';
```

### From `src/services/`

```typescript
import { execute as initExecute } from '../../../src/services/init.service.js';
import { execute as archiveExecute } from '../../../src/services/archive.service.js';
import { createStory } from '../../../src/services/change-story.service.js';
import { generatePlan } from '../../../src/services/change-plan.service.js';
```

### From `src/types/`

```typescript
import { SKILL_DEFINITIONS } from '../../src/types/skill.js';
import { ConfigNotFound, ConfigInvalid } from '../../src/types/errors.js';
```

## Test Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,           // No global test APIs (explicit imports)
    root: '.',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',         // Native v8 coverage (fast)
      include: ['src/**/*.ts'],
      exclude: ['src/templates/**'], // Templates validated via contracts
    },
    unstubEnvs: true,        // Allow real env vars in tests
  },
});
```

### Key Config Decisions

**`globals: false`**
- Requires explicit imports: `import { describe, it, expect } from 'vitest'`
- Prevents accidental global pollution
- Better IDE autocomplete

**Coverage excludes `src/templates/**`**
- Handlebars templates validated via contract tests
- v8 coverage doesn't instrument .hbs files
- Template rendering tested functionally (not via coverage metrics)

**`unstubEnvs: true`**
- Allows tests to read real environment variables
- Needed for E2E tests that spawn child processes

## Runtime Requirements

### For Unit/Integration Tests

- **Node.js 18+** (ESM support)
- No real filesystem required (uses memfs)

### For E2E Tests

- **Node.js 18+**
- **Built CLI** (`dist/cli/index.js` must exist)
- **Real tmpdir** (uses `os.tmpdir()` for temp projects)

### Pre-test Build Step

E2E tests require CLI to be built:

```bash
npm run build   # Compile src/ → dist/
npm test        # Runs all tests (unit + integration + contract + e2e)
```

Package.json enforces build-before-test order:

```json
{
  "scripts": {
    "test": "npm run build && vitest run"
  }
}
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
