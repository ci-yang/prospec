# Tests Module: Testing Patterns

> Common testing patterns and best practices used across the test suite

<!-- prospec:auto-start -->

## 1. memfs Virtual Filesystem Pattern

### Setup

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset(); // Clean slate for each test
});
```

**Why async factory?** Vitest ESM mocking requires async import for memfs.

**Why spread operator?** Ensures all fs methods are mocked (readFile, writeFile, existsSync, etc.)

**Why `default`?** Supports both named and default imports of fs.

### Usage: Populate Virtual Filesystem

```typescript
describe('config.test.ts', () => {
  it('should read and validate an existing config', async () => {
    // ARRANGE: Setup virtual filesystem
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test-project\n',
    });

    // ACT: Read config from virtual filesystem
    const config = await readConfig('/project');

    // ASSERT: Verify config was read correctly
    expect(config.project.name).toBe('test-project');
  });
});
```

### Usage: Verify File Creation

```typescript
describe('writeConfig', () => {
  it('should write config to .prospec.yaml', async () => {
    // ARRANGE: Create empty virtual directory
    vol.fromJSON({}, '/');
    vol.mkdirSync('/project', { recursive: true });

    // ACT: Write config
    await writeConfig({ project: { name: 'test' } }, '/project');

    // ASSERT: Verify file exists and has correct content
    const content = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    expect(content).toContain('name: test');
  });
});
```

### Cleanup Pattern

```typescript
beforeEach(() => {
  vol.reset(); // ✅ Reset filesystem before each test
});

// ❌ DON'T: Reset in afterEach (tests should be independent)
```

**Why `beforeEach`?** Ensures clean state even if previous test crashes.

## 2. Service Testing Pattern (Arrange-Act-Assert)

### Archive Service Example

```typescript
describe('archive.service.test.ts', () => {
  it('should archive verified changes and update metadata to archived', async () => {
    // ARRANGE: Setup filesystem with change directory
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml':
        'name: feat-a\nstatus: verified\ncreated: "2026-01-01"\n',
      '/project/.prospec/changes/feat-a/proposal.md': `# Proposal

## User Story

As a dev, I want X, so that Y.
`,
      '/project/.prospec/changes/feat-a/delta-spec.md': `# Delta Spec

## ADDED

### REQ-TYPES-001: Some type change

Details.
`,
      '/project/.prospec/changes/feat-a/tasks.md':
        '- [x] Task 1\n- [x] Task 2\n',
    });

    // ACT: Execute archive service
    const result = await execute({ cwd: '/project' });

    // ASSERT: Verify outcome
    expect(result.archived).toHaveLength(1);
    expect(result.archived[0]!.name).toBe('feat-a');
    expect(result.archived[0]!.summaryGenerated).toBe(true);
    expect(result.affectedModules).toContain('types');

    // Verify metadata was updated to archived
    const archiveDir = result.archived[0]!.archivePath;
    const metaContent = fs.readFileSync(`${archiveDir}/metadata.yaml`, 'utf-8');
    expect(metaContent).toContain('archived');

    // Verify summary.md was generated
    expect(fs.existsSync(`${archiveDir}/summary.md`)).toBe(true);

    // Verify source directory was removed
    expect(fs.existsSync('/project/.prospec/changes/feat-a')).toBe(false);
  });
});
```

**Key Points**:
- **ARRANGE**: Setup entire filesystem context
- **ACT**: Single service call
- **ASSERT**: Multiple verification points (return value, files created/moved, metadata updated)

## 3. Config Validation Pattern

### Happy Path

```typescript
describe('validateConfig', () => {
  it('should validate a correct config', () => {
    const yaml = `
project:
  name: my-project
`;
    const config = validateConfig(yaml);
    expect(config.project.name).toBe('my-project');
  });
});
```

### Error Cases

```typescript
it('should throw ConfigInvalid when project.name is missing', () => {
  const yaml = `
project:
  version: "1.0"
`;
  expect(() => validateConfig(yaml)).toThrow(ConfigInvalid);
});

it('should throw ConfigInvalid for completely invalid structure', () => {
  const yaml = `foo: bar`;
  expect(() => validateConfig(yaml)).toThrow(ConfigInvalid);
});
```

### Optional Fields

```typescript
it('should accept optional fields', () => {
  const yaml = `
project:
  name: test
tech_stack:
  language: typescript
agents:
  - claude
  - gemini
`;
  const config = validateConfig(yaml);
  expect(config.tech_stack?.language).toBe('typescript');
  expect(config.agents).toEqual(['claude', 'gemini']);
});
```

## 4. Template Rendering Validation

### Contract Testing Pattern

```typescript
describe('Skill Format Contract', () => {
  const TEMPLATE_CONTEXT = {
    project_name: 'test-project',
    knowledge_base_path: 'docs/ai-knowledge',
    constitution_path: 'docs/CONSTITUTION.md',
    tech_stack: { language: 'typescript', framework: 'express' },
    skills: SKILL_DEFINITIONS.map((s) => ({
      name: s.name,
      description: s.description,
      type: s.type,
      hasReferences: s.hasReferences,
    })),
  };

  for (const skill of SKILL_DEFINITIONS) {
    describe(`${skill.name}`, () => {
      it('should render without errors', () => {
        const content = renderTemplate(
          `skills/${skill.name}.hbs`,
          TEMPLATE_CONTEXT,
        );
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });

      it('should contain YAML frontmatter', () => {
        const content = renderTemplate(
          `skills/${skill.name}.hbs`,
          TEMPLATE_CONTEXT,
        );
        expect(content.startsWith('---')).toBe(true);
        const secondDash = content.indexOf('---', 3);
        expect(secondDash).toBeGreaterThan(3);
      });

      it('should contain name field in frontmatter', () => {
        const content = renderTemplate(
          `skills/${skill.name}.hbs`,
          TEMPLATE_CONTEXT,
        );
        const frontmatter = extractFrontmatter(content);
        expect(frontmatter).toContain('name:');
      });
    });
  }
});

function extractFrontmatter(content: string): string {
  if (!content.startsWith('---')) return '';
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return '';
  return content.slice(3, endIndex).trim();
}
```

**Pattern Benefits**:
- Loop over all skill definitions (DRY)
- Each skill gets 3+ assertions
- Frontmatter extraction helper reused across tests

## 5. Integration Test Pattern

### Full Workflow Testing

```typescript
describe('Init Flow Integration', () => {
  it('should complete full init workflow: create config + dirs + templates', async () => {
    // ARRANGE: Minimal project context
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-project' }),
      '/project/tsconfig.json': '{}',
    });

    // ACT: Execute init service
    const result = await execute({
      name: 'my-project',
      agents: ['claude', 'gemini'],
      cwd: '/project',
    });

    // ASSERT: Verify service result
    expect(result.projectName).toBe('my-project');
    expect(result.techStack.language).toBe('typescript');
    expect(result.selectedAgents).toEqual(['claude', 'gemini']);
    expect(result.createdFiles.length).toBeGreaterThan(0);

    // ASSERT: Verify config file can be read back
    const configContent = fs.readFileSync('/project/.prospec.yaml', 'utf-8');
    const config = validateConfig(configContent);
    expect(config.project.name).toBe('my-project');

    // ASSERT: Verify directory structure
    expect(fs.existsSync('/project/prospec/ai-knowledge')).toBe(true);
    expect(fs.existsSync('/project/prospec/specs')).toBe(true);
    expect(fs.existsSync('/project/prospec/CONSTITUTION.md')).toBe(true);
  });
});
```

**Key Differences from Unit Tests**:
- Tests multiple components together (service + lib)
- Verifies filesystem state after operation
- Validates cross-boundary contracts (e.g., written config can be read back)

## 6. E2E CLI Testing Pattern

### Setup: Real tmpdir

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve(__dirname, '../../dist/cli/index.js');
const NODE = process.execPath;

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'prospec-e2e-'));
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});
```

### Run CLI Helper

```typescript
async function runCli(
  args: string[],
  options: { cwd?: string } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execFileAsync(NODE, [CLI_PATH, ...args], {
      cwd: options.cwd ?? tmpDir,
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; code?: number | string };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      exitCode: typeof e.code === 'number' ? e.code : 1,
    };
  }
}
```

### E2E Test Example

```typescript
describe('prospec init', () => {
  it('should create .prospec.yaml and directory structure', async () => {
    // ARRANGE: Create package.json for tech detection
    await fs.promises.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'e2e-test-project' }),
    );

    // ACT: Run CLI
    const { exitCode } = await runCli([
      'init',
      '--name',
      'e2e-test-project',
      '--agents',
      'claude',
    ]);

    // ASSERT: CLI exited successfully
    expect(exitCode).toBe(0);

    // ASSERT: Config file created
    const configPath = path.join(tmpDir, '.prospec.yaml');
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = await fs.promises.readFile(configPath, 'utf-8');
    expect(configContent).toContain('e2e-test-project');

    // ASSERT: Directory structure created
    expect(fs.existsSync(path.join(tmpDir, 'prospec', 'ai-knowledge'))).toBe(true);
  });
});
```

**Why not memfs for E2E?**
- memfs does NOT propagate to child processes
- E2E tests spawn real `node dist/cli/index.js` process
- Need real tmpdir for child process to read/write files

## 7. Mocking External Modules

### Mock inquirer prompts

```typescript
vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['claude']),
  input: vi.fn().mockResolvedValue('prospec'),
  Separator: class Separator {
    constructor(public text?: string) {}
  },
}));
```

### Mock os.homedir

```typescript
vi.mock('node:os', () => ({
  homedir: () => '/home/testuser',
  default: { homedir: () => '/home/testuser' },
}));
```

### Mock template rendering (integration tests)

```typescript
vi.mock('../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockReturnValue('# Template Content\n'),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));
```

**Why mock templates in integration tests?**
- Focus on service logic, not template content
- Contract tests validate templates separately
- Faster test execution (no Handlebars compilation)

## 8. Data-Driven Testing Pattern

### Test Multiple Cases

```typescript
describe('filterByStatus', () => {
  const changes = [
    { name: 'a', dir: '/a', metadata: { status: 'verified' }, status: 'verified' },
    { name: 'b', dir: '/b', metadata: { status: 'tasks' }, status: 'tasks' },
    { name: 'c', dir: '/c', metadata: { status: 'verified' }, status: 'verified' },
    { name: 'd', dir: '/d', metadata: { status: 'story' }, status: 'story' },
  ];

  it('should filter by verified status (default)', () => {
    const result = filterByStatus(changes);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name)).toEqual(['a', 'c']);
  });

  it('should filter by specified status', () => {
    const result = filterByStatus(changes, 'tasks');
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('b');
  });

  it('should return empty when no matches', () => {
    const result = filterByStatus(changes, 'archived');
    expect(result).toHaveLength(0);
  });
});
```

### Loop Over Definitions

```typescript
const AGENT_CONFIGS = ['claude', 'gemini', 'copilot', 'codex'];

for (const agent of AGENT_CONFIGS) {
  it(`should render ${agent}.md.hbs without errors`, () => {
    const content = renderTemplate(
      `agent-configs/${agent}.md.hbs`,
      TEMPLATE_CONTEXT,
    );
    expect(content).toBeTruthy();
  });
}
```

## 9. Error Testing Pattern

### Expect Specific Error Types

```typescript
import { ConfigNotFound, ConfigInvalid, AlreadyExistsError } from '../../../src/types/errors.js';

it('should throw ConfigNotFound when file does not exist', async () => {
  vol.fromJSON({}, '/');
  await expect(readConfig('/project')).rejects.toThrow(ConfigNotFound);
});

it('should throw ConfigInvalid for invalid content', async () => {
  vol.fromJSON({
    '/project/.prospec.yaml': 'invalid: true\n',
  });
  await expect(readConfig('/project')).rejects.toThrow(ConfigInvalid);
});

it('should prevent double initialization', async () => {
  vol.fromJSON({
    '/project/package.json': JSON.stringify({ name: 'test' }),
  });

  await execute({ name: 'test', agents: ['claude'], cwd: '/project' });

  await expect(
    execute({ name: 'test', agents: ['claude'], cwd: '/project' }),
  ).rejects.toThrow(AlreadyExistsError);
});
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
