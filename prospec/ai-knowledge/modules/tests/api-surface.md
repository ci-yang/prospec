# Tests Module: API Surface

> Test file structure, describe blocks, and utility patterns

<!-- prospec:auto-start -->

## Test File Organization

### Layer 1: Unit Tests

#### `unit/lib/` — Utility Tests

```
unit/lib/config.test.ts
├── resolveConfigPath
├── validateConfig
├── readConfig
├── resolveBasePaths
└── writeConfig

unit/lib/template.test.ts
├── renderTemplate
├── registerPartial
└── registerHelper

unit/lib/scanner.test.ts
├── scanDirectory
├── detectModules
└── buildFileTree

unit/lib/yaml-utils.test.ts
├── parseYaml
├── stringifyYaml
└── extractFrontmatter

unit/lib/content-merger.test.ts
├── mergeWithPreservation
└── parseAutoUserSections

unit/lib/logger.test.ts
├── info/warn/error levels
└── quiet/verbose modes

unit/lib/fs-utils.test.ts
├── ensureDir
├── copyRecursive
└── removeDir

unit/lib/detector.test.ts
├── detectTechStack
└── detectAgents

unit/lib/agent-detector.test.ts
└── detectAgentFromProject

unit/lib/module-detector.test.ts
└── detectModulesFromStructure
```

#### `unit/services/` — Service Tests

```
unit/services/archive.service.test.ts
├── scanChanges
├── filterByStatus
├── moveToArchive
├── generateSummary
└── execute

unit/services/change-story.service.test.ts
├── createStory
├── validateStoryName
└── updateMetadata

unit/services/change-plan.service.test.ts
├── generatePlan
└── createDeltaSpec

unit/services/change-tasks.service.test.ts
├── generateTasks
└── parseTaskList

unit/services/knowledge.service.test.ts
├── generateKnowledge
├── updateKnowledge
└── scanForModules

unit/services/knowledge-init.service.test.ts
├── execute
└── generateRawScan

unit/services/knowledge-update.service.test.ts
├── execute
└── parseDeltaSpec

unit/services/init.service.test.ts
├── execute
└── detectTechStack

unit/services/steering.service.test.ts
├── execute
└── generateSteering

unit/services/agent-sync.service.test.ts
├── syncAgents
└── generateAgentConfig
```

### Layer 2: Integration Tests

```
integration/init-flow.test.ts
└── Init Flow Integration
    ├── should complete full init workflow
    ├── should prevent double initialization
    └── should produce valid config

integration/change-flow.test.ts
└── Change Flow Integration
    ├── story → plan workflow
    ├── plan → tasks workflow
    └── full change lifecycle

integration/steering-flow.test.ts
└── Steering Flow Integration
    └── raw-scan generation from source files

integration/skill-generation.test.ts
└── Skill Generation Integration
    ├── generate all 10 skills
    └── verify skill count matches SKILL_DEFINITIONS
```

### Layer 3: Contract Tests

```
contract/skill-format.test.ts
└── Skill Format Contract
    ├── Skill template rendering (10 skills)
    │   ├── prospec-explore
    │   ├── prospec-new-story
    │   ├── prospec-plan
    │   ├── prospec-tasks
    │   ├── prospec-ff
    │   ├── prospec-implement
    │   ├── prospec-verify
    │   ├── prospec-knowledge-generate
    │   ├── prospec-archive
    │   └── prospec-knowledge-update
    ├── Reference templates (9 templates)
    │   ├── proposal-format.hbs
    │   ├── plan-format.hbs
    │   ├── delta-spec-format.hbs
    │   ├── tasks-format.hbs
    │   ├── implementation-guide.hbs
    │   ├── knowledge-format.hbs
    │   ├── knowledge-generate-format.hbs
    │   ├── archive-format.hbs
    │   └── knowledge-update-format.hbs
    ├── Skill definitions
    │   ├── should have 10 skill definitions
    │   ├── should include all expected skill names
    │   ├── should have valid skill types
    │   └── skills with references should have hasReferences = true
    └── Agent config templates (4 agents)
        ├── claude.md.hbs
        ├── gemini.md.hbs
        ├── copilot.md.hbs
        └── codex.md.hbs

contract/cli-output.test.ts
└── CLI Output Contract
    ├── init command output format
    ├── change command output format
    └── error message format
```

### Layer 4: E2E Tests

```
e2e/cli.test.ts
└── CLI E2E
    ├── prospec --version
    ├── prospec --help
    ├── prospec init
    ├── prospec steering
    ├── prospec change story
    ├── prospec change plan
    ├── prospec knowledge generate
    ├── prospec knowledge init
    ├── prospec agent sync
    └── unknown command (typo suggestions)
```

## Key Test Utility Patterns

### 1. memfs Virtual Filesystem Setup

```typescript
import { vol } from 'memfs';
import { vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset(); // Clean slate for each test
});

// Populate virtual filesystem
vol.fromJSON({
  '/project/.prospec.yaml': 'project:\n  name: test\n',
  '/project/src/index.ts': 'export const hello = "world";',
});
```

### 2. Config Mocking Pattern

```typescript
// Mock config reading
vol.fromJSON({
  '/project/.prospec.yaml': `
project:
  name: my-project
tech_stack:
  language: typescript
agents:
  - claude
`,
});

const config = await readConfig('/project');
expect(config.project.name).toBe('my-project');
```

### 3. Service Testing Pattern (Arrange-Act-Assert)

```typescript
describe('archive.service', () => {
  it('should move verified changes to archive', async () => {
    // ARRANGE: Setup filesystem
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'status: verified\n',
      '/project/.prospec/changes/feat-a/proposal.md': '# Proposal\n',
    });

    // ACT: Execute service
    const result = await execute({ cwd: '/project' });

    // ASSERT: Verify outcome
    expect(result.archived).toHaveLength(1);
    expect(fs.existsSync('/project/.prospec/archive/...')).toBe(true);
  });
});
```

### 4. Template Rendering Validation

```typescript
const content = renderTemplate('skills/prospec-plan.hbs', {
  project_name: 'test',
  knowledge_base_path: 'docs/ai-knowledge',
});

// Extract frontmatter
const frontmatter = content.slice(
  content.indexOf('---') + 3,
  content.indexOf('---', 3)
);
expect(frontmatter).toContain('name:');
expect(frontmatter).toContain('description:');
```

### 5. E2E CLI Execution

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function runCli(args: string[], cwd: string) {
  const { stdout, stderr } = await execFileAsync(
    'node',
    ['dist/cli/index.js', ...args],
    { cwd, timeout: 15000 }
  );
  return { stdout, stderr };
}

// Usage
const { stdout } = await runCli(['--version'], tmpDir);
expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
```

### 6. Contract Testing for Skill Definitions

```typescript
import { SKILL_DEFINITIONS } from '../../src/types/skill.js';

it('should have 10 skill definitions', () => {
  expect(SKILL_DEFINITIONS).toHaveLength(10);
});

it('should include all expected skill names', () => {
  const names = SKILL_DEFINITIONS.map(s => s.name);
  expect(names).toContain('prospec-explore');
  expect(names).toContain('prospec-new-story');
  // ... etc
});
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
