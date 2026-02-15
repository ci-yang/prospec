# API Surface

> All public exports from the services module with exact TypeScript signatures.

<!-- prospec:auto-start -->

## init.service.ts

```typescript
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

export async function execute(options: InitOptions): Promise<InitResult>

// Re-exported from lib/detector
export type { TechStackResult }
```

## steering.service.ts

```typescript
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
  modules: Array<{
    name: string;
    description: string;
    fileCount: number;
    keywords: string[];
    relationships: {
      depends_on: string[];
      used_by: string[];
    };
  }>;
  outputFiles: string[];
  dryRun: boolean;
}

export async function execute(
  options: SteeringOptions,
): Promise<SteeringResult>
```

## knowledge.service.ts

```typescript
export interface KnowledgeOptions {
  dryRun?: boolean;
  cwd?: string;
}

export interface GeneratedFile {
  path: string;
  action: 'created' | 'updated';
}

export interface KnowledgeResult {
  moduleCount: number;
  modules: Array<{
    name: string;
    description: string;
    fileCount: number;
    keywords: string[];
  }>;
  generatedFiles: GeneratedFile[];
  dryRun: boolean;
}

export async function execute(
  options: KnowledgeOptions,
): Promise<KnowledgeResult>
```

## knowledge-init.service.ts

```typescript
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

export async function execute(
  options: KnowledgeInitOptions,
): Promise<KnowledgeInitResult>
```

## knowledge-update.service.ts

```typescript
export interface KnowledgeUpdateOptions {
  /** Path to delta-spec.md (auto mode) */
  deltaSpecPath?: string;
  /** Manual module names to update (manual mode) */
  manualModules?: string[];
  /** Working directory */
  cwd?: string;
}

export interface DeltaReqEntry {
  /** REQ ID (e.g., REQ-SERVICES-020) */
  id: string;
  /** Module name extracted from REQ ID (e.g., services) */
  module: string;
  /** Requirement title/description */
  description: string;
}

export interface DeltaSpecResult {
  added: DeltaReqEntry[];
  modified: DeltaReqEntry[];
  removed: DeltaReqEntry[];
}

export interface GeneratedFile {
  path: string;
  action: 'created' | 'updated' | 'deprecated';
}

export interface KnowledgeUpdateResult {
  /** Modules that were created (ADDED) */
  created: string[];
  /** Modules that were updated (MODIFIED) */
  updated: string[];
  /** Modules that were marked deprecated (REMOVED) */
  deprecated: string[];
  /** All generated/modified file paths */
  generatedFiles: GeneratedFile[];
}

export async function execute(
  options: KnowledgeUpdateOptions,
): Promise<KnowledgeUpdateResult>

export function parseDeltaSpec(content: string): DeltaSpecResult

export function identifyAffectedModules(
  deltaResult: DeltaSpecResult,
  moduleMapPath: string,
): string[]

export async function updateModuleReadme(
  moduleName: string,
  modulePaths: string[],
  options: { cwd: string; knowledgeBasePath: string; excludePatterns?: string[] },
): Promise<GeneratedFile>

export async function markModuleDeprecated(
  moduleName: string,
  reason: string,
  options: { cwd: string; knowledgeBasePath: string },
): Promise<GeneratedFile | null>

export async function updateIndex(
  modules: Array<{ name: string; description: string; status: string }>,
  options: { cwd: string; knowledgeBasePath: string; projectName: string },
): Promise<GeneratedFile>

export async function updateModuleMap(
  changes: { added: string[]; removed: string[] },
  moduleMapPath: string,
): Promise<GeneratedFile | null>
```

## change-story.service.ts

```typescript
export interface ChangeStoryOptions {
  name: string;
  description?: string;
  cwd?: string;
}

export interface RelatedModule {
  name: string;
  description: string;
}

export interface ChangeStoryResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: RelatedModule[];
  description?: string;
}

export async function execute(options: ChangeStoryOptions): Promise<ChangeStoryResult>
```

## change-plan.service.ts

```typescript
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

export async function execute(options: ChangePlanOptions): Promise<ChangePlanResult>
```

## change-tasks.service.ts

```typescript
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

export async function execute(options: ChangeTasksOptions): Promise<ChangeTasksResult>
```

## agent-sync.service.ts

```typescript
export interface AgentSyncOptions {
  /** Specific CLI to sync (e.g., 'claude'). If undefined, sync all configured agents. */
  cli?: string;
  /** Working directory */
  cwd?: string;
}

export interface AgentSyncFullResult {
  /** Results per agent */
  agents: AgentSyncResult[];
  /** Total number of files generated */
  totalFiles: number;
}

export async function execute(
  options: AgentSyncOptions,
): Promise<AgentSyncFullResult>
```

## archive.service.ts

```typescript
export interface ArchiveOptions {
  /** Filter changes by this status (default: 'verified') */
  status?: ChangeStatus;
  /** Specific change names to archive (if empty, archive all matching) */
  names?: string[];
  /** Working directory */
  cwd?: string;
}

export interface ChangeEntry {
  name: string;
  dir: string;
  metadata: Record<string, unknown>;
  status: string;
}

export interface ArchiveResult {
  archived: ArchivedChange[];
  skipped: string[];
  affectedModules: string[];
  knowledgeUpdated: boolean;
}

export interface ArchivedChange {
  name: string;
  sourcePath: string;
  archivePath: string;
  summaryGenerated: boolean;
}

export async function execute(options: ArchiveOptions): Promise<ArchiveResult>

export async function scanChanges(cwd: string): Promise<ChangeEntry[]>

export function filterByStatus(
  changes: ChangeEntry[],
  status?: ChangeStatus,
): ChangeEntry[]

export async function moveToArchive(
  change: ChangeEntry,
  cwd: string,
): Promise<string>

export async function generateSummary(
  archiveDir: string,
  changeName: string,
  createdDate: string,
): Promise<{ content: string; affectedModules: string[] }>
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
