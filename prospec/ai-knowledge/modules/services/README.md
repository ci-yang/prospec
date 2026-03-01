# Services Module

> Business logic layer implementing Prospec CLI workflows. Each service maps to one CLI command and exposes a single `execute(options) → Promise<Result>` function.

<!-- prospec:auto-start -->

## Overview

The **services** module contains business logic for all Prospec CLI commands. Each service:

1. **One service per CLI command** — `init.service.ts` → `prospec init`, `steering.service.ts` → `prospec steering`, etc.
2. **execute() pattern** — All services expose a single async `execute(options)` function that returns a typed result.
3. **Orchestration layer** — Services coordinate between `lib` utilities (scanner, detector, template renderer, config reader) and produce final outputs (files, status, metadata).
4. **Type-safe interfaces** — Each service defines `Options` and `Result` interfaces for contract clarity.

## Key Files

| File | Purpose | Primary Exports |
|------|---------|-----------------|
| `init.service.ts` | Project initialization | `execute(InitOptions) → InitResult` |
| `steering.service.ts` | Architecture discovery | `execute(SteeringOptions) → SteeringResult` |
| `knowledge.service.ts` | Module knowledge generation | `execute(KnowledgeOptions) → KnowledgeResult` |
| `knowledge-init.service.ts` | Initial knowledge scan | `execute(KnowledgeInitOptions) → KnowledgeInitResult` |
| `knowledge-update.service.ts` | Incremental knowledge update | `execute(KnowledgeUpdateOptions) → KnowledgeUpdateResult` |
| `change-story.service.ts` | Create change proposal | `execute(ChangeStoryOptions) → ChangeStoryResult` |
| `change-plan.service.ts` | Generate implementation plan | `execute(ChangePlanOptions) → ChangePlanResult` |
| `change-tasks.service.ts` | Generate task list | `execute(ChangeTasksOptions) → ChangeTasksResult` |
| `agent-sync.service.ts` | Sync AI agent skills | `execute(AgentSyncOptions) → AgentSyncFullResult` |
| `archive.service.ts` | Archive completed changes | `execute(ArchiveOptions) → ArchiveResult` |

## Public API

### Init Service

```typescript
export function execute(options: InitOptions): Promise<InitResult>
export interface InitOptions {
  name?: string;
  agents?: string[];
  cwd?: string;
}
export interface InitResult {
  projectName: string;
  techStack: TechStackResult;
  agentInfos: AgentInfo[];
  selectedAgents: string[];
  createdFiles: string[];
}
```

### Steering Service

```typescript
export function execute(options: SteeringOptions): Promise<SteeringResult>
export interface SteeringOptions {
  dryRun?: boolean;
  depth?: number;
  cwd?: string;
}
export interface SteeringResult {
  fileCount: number;
  moduleCount: number;
  architecture: string;
  entryPoints: string[];
  modules: Array<{ name: string; description: string; fileCount: number; keywords: string[]; relationships: { depends_on: string[]; used_by: string[] } }>;
  outputFiles: string[];
  dryRun: boolean;
}
```

### Knowledge Service

```typescript
export function execute(options: KnowledgeOptions): Promise<KnowledgeResult>
export interface KnowledgeOptions {
  dryRun?: boolean;
  cwd?: string;
}
export interface KnowledgeResult {
  moduleCount: number;
  modules: Array<{ name: string; description: string; fileCount: number; keywords: string[] }>;
  generatedFiles: GeneratedFile[];
  dryRun: boolean;
}
export interface GeneratedFile {
  path: string;
  action: 'created' | 'updated';
}
```

### Knowledge Init Service

```typescript
export function execute(options: KnowledgeInitOptions): Promise<KnowledgeInitResult>
export interface KnowledgeInitOptions {
  dryRun?: boolean;
  depth?: number;
  cwd?: string;
}
export interface KnowledgeInitResult {
  totalFiles: number;
  scanDepth: number;
  entryPoints: string[];
  dependencies: Array<{ name: string; version?: string }>;
  configFiles: string[];
  outputFiles: string[];
  dryRun: boolean;
}
```

### Knowledge Update Service

```typescript
export function execute(options: KnowledgeUpdateOptions): Promise<KnowledgeUpdateResult>
export interface KnowledgeUpdateOptions {
  deltaSpecPath?: string;
  manualModules?: string[];
  cwd?: string;
}
export interface KnowledgeUpdateResult {
  created: string[];
  updated: string[];
  deprecated: string[];
  generatedFiles: GeneratedFile[];
}
export interface GeneratedFile {
  path: string;
  action: 'created' | 'updated' | 'deprecated';
}

// Also exports:
export function parseDeltaSpec(content: string): DeltaSpecResult
export function identifyAffectedModules(deltaResult: DeltaSpecResult, moduleMapPath: string): string[]
export function updateModuleReadme(moduleName: string, modulePaths: string[], options: { cwd: string; knowledgeBasePath: string; excludePatterns?: string[] }): Promise<GeneratedFile>
export function markModuleDeprecated(moduleName: string, reason: string, options: { cwd: string; knowledgeBasePath: string }): Promise<GeneratedFile | null>
export function updateIndex(modules: Array<{ name: string; description: string; status: string }>, options: { cwd: string; knowledgeBasePath: string; projectName: string }): Promise<GeneratedFile>
export function updateModuleMap(changes: { added: string[]; removed: string[] }, moduleMapPath: string): Promise<GeneratedFile | null>
```

### Change Story Service

```typescript
export function execute(options: ChangeStoryOptions): Promise<ChangeStoryResult>
export interface ChangeStoryOptions {
  name: string;
  description?: string;
  cwd?: string;
}
export interface ChangeStoryResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: RelatedModule[];
  description?: string;
}
```

### Change Plan Service

```typescript
export function execute(options: ChangePlanOptions): Promise<ChangePlanResult>
export interface ChangePlanOptions {
  change?: string;
  quiet?: boolean;
  cwd?: string;
}
export interface ChangePlanResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: string[];
}
```

### Change Tasks Service

```typescript
export function execute(options: ChangeTasksOptions): Promise<ChangeTasksResult>
export interface ChangeTasksOptions {
  change?: string;
  quiet?: boolean;
  cwd?: string;
}
export interface ChangeTasksResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: string[];
}
```

### Agent Sync Service

```typescript
export function execute(options: AgentSyncOptions): Promise<AgentSyncFullResult>
export interface AgentSyncOptions {
  cli?: string;
  cwd?: string;
}
export interface AgentSyncFullResult {
  agents: AgentSyncResult[];
  totalFiles: number;
}
```

### Archive Service

```typescript
export function execute(options: ArchiveOptions): Promise<ArchiveResult>
export interface ArchiveOptions {
  status?: ChangeStatus;
  names?: string[];
  cwd?: string;
}
export interface ArchiveResult {
  archived: ArchivedChange[];
  skipped: string[];
  affectedModules: string[];
  knowledgeUpdated: boolean;
  specFiles: string[];  // Paths to Feature Spec files written to specs/features/
}

// Also exports:
export function scanChanges(cwd: string): Promise<ChangeEntry[]>
export function filterByStatus(changes: ChangeEntry[], status?: ChangeStatus): ChangeEntry[]
export function moveToArchive(change: ChangeEntry, cwd: string): Promise<string>
export function generateSummary(archiveDir: string, changeName: string, createdDate: string): Promise<{ content: string; affectedModules: string[] }>
export function syncToFeatureSpecs(archiveDir: string, featuresPath: string): Promise<string[]>
export function generateProductSpec(featuresPath: string, productSpecPath: string, projectName: string): Promise<string>
```

## Workflow Sequences

### Knowledge Flow

1. **prospec init** → `init.service.ts`
   - Detects tech stack, agents
   - Writes `.prospec.yaml`, `CONSTITUTION.md`, `AGENTS.md`, knowledge skeletons
2. **prospec steering** → `steering.service.ts`
   - Scans project with `scanner.scanDir()`
   - Detects modules with `module-detector.detectModules()`
   - Writes `module-map.yaml`, `architecture.md`
3. **prospec knowledge** → `knowledge.service.ts`
   - Reads `module-map.yaml`
   - Scans each module's files
   - Generates module `README.md` (uses `ContentMerger` to preserve user sections)
   - Updates `_index.md`

### Change Flow

1. **prospec change story** → `change-story.service.ts`
   - Validates change name doesn't exist
   - Matches related modules from `_index.md`
   - Writes `proposal.md`, `metadata.yaml`
2. **prospec change plan** → `change-plan.service.ts`
   - Resolves change (auto-detect / prompt / `--change`)
   - Validates `proposal.md` exists
   - Writes `plan.md`, `delta-spec.md`
   - Updates metadata status to `'plan'`
3. **prospec change tasks** → `change-tasks.service.ts`
   - Resolves change
   - Validates `plan.md` exists
   - Writes `tasks.md`
   - Updates metadata status to `'tasks'`
4. **prospec archive** → `archive.service.ts`
   - Scans `.prospec/changes/` for verified changes
   - Moves to `.prospec/archive/{YYYY-MM-DD}-{name}/`
   - Generates `summary.md`
   - Syncs requirements to `specs/features/` via `syncToFeatureSpecs()` (Replace-in-Place, non-fatal)
   - Regenerates `specs/product.md` from Feature Spec frontmatter via `generateProductSpec()` (non-fatal)
   - Auto-triggers knowledge update (non-fatal)

## Dependencies

### Internal

- **lib/config** — `readConfig`, `writeConfig`, `resolveBasePaths`
- **lib/fs-utils** — `atomicWrite`, `ensureDir`, `fileExists`
- **lib/template** — `renderTemplate`
- **lib/scanner** — `scanDir`
- **lib/detector** — `detectTechStack`
- **lib/module-detector** — `detectModules`
- **lib/agent-detector** — `detectAgents`
- **lib/content-merger** — `mergeContent`
- **lib/yaml-utils** — `parseYaml`, `stringifyYaml`
- **types/** — All type definitions (`config`, `change`, `skill`, `errors`, `module-map`)

### External

- `@inquirer/prompts` — Interactive prompts (`select`, `checkbox`, `input`)

## Design Decisions

1. **Uniform execute() pattern** — All services use `execute(options) → Promise<Result>` for consistency. This makes services easy to test and compose.
2. **Change name resolution** — `change-plan.service` and `change-tasks.service` implement the same `resolveChange()` strategy: `--change` flag > auto-detect single change > interactive prompt > error. This prevents mistakes in multi-change scenarios.
3. **Non-fatal error handling** — `archive.service` treats summary generation and knowledge update failures as non-fatal. Archive operation succeeds even if these steps fail, preventing data loss from transient errors.
4. **ContentMerger for regeneration** — `knowledge.service` and `knowledge-update.service` use `ContentMerger` to preserve user-written content within `prospec:user-start/end` markers when regenerating module READMEs.
5. **Metadata status updates** — All change workflow services update `metadata.yaml` status field atomically: `'story'` → `'plan'` → `'tasks'` → `'verified'` → `'archived'`. This provides workflow state tracking.

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
