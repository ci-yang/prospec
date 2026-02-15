# Patterns

> Common design patterns and idioms used in the services module.

<!-- prospec:auto-start -->

## Pattern 1: execute(options) → Result

All services expose a single `execute()` function that accepts an `Options` interface and returns a typed `Result` via `Promise`.

**Purpose**: Uniform contract for all business logic. Makes services easy to test, compose, and call from CLI commands.

**Implementation**:

```typescript
// init.service.ts
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

export async function execute(options: InitOptions): Promise<InitResult> {
  const cwd = options.cwd ?? process.cwd();
  // ... workflow steps
  return {
    projectName,
    techStack,
    agentInfos,
    selectedAgents,
    createdFiles,
  };
}
```

**Usage in CLI**:

```typescript
// cli/commands/init.command.ts
const result = await execute({ name, agents, cwd });
console.log(`Created ${result.createdFiles.length} files`);
```

## Pattern 2: Change Name Resolution Strategy

Services `change-plan.service` and `change-tasks.service` implement the same multi-step change resolution algorithm.

**Purpose**: Prevent accidental operations in multi-change scenarios. Auto-detect when safe, prompt when ambiguous, error when impossible.

**Implementation**:

```typescript
// change-plan.service.ts
async function resolveChange(
  cwd: string,
  explicitChange: string | undefined,
  quiet: boolean | undefined,
): Promise<string> {
  // Step 1: --change flag takes precedence
  if (explicitChange) {
    const changeDir = path.join(cwd, '.prospec', 'changes', explicitChange);
    if (!fs.existsSync(changeDir)) {
      throw new PrerequisiteError(
        `找不到變更 '${explicitChange}'`,
        '請確認變更名稱正確，或執行 \`prospec change story\` 建立新的變更',
      );
    }
    return explicitChange;
  }

  // Step 2: Scan .prospec/changes/
  const changesDir = path.join(cwd, '.prospec', 'changes');
  if (!fs.existsSync(changesDir)) {
    throw new PrerequisiteError(
      '找不到任何變更',
      '請先執行 \`prospec change story <name>\` 建立變更需求',
    );
  }

  const entries = fs.readdirSync(changesDir, { withFileTypes: true });
  const changeNames = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  // Step 3: No changes → error
  if (changeNames.length === 0) {
    throw new PrerequisiteError(
      '找不到任何變更',
      '請先執行 \`prospec change story <name>\` 建立變更需求',
    );
  }

  // Step 4: Single change → auto-select
  if (changeNames.length === 1) {
    return changeNames[0]!;
  }

  // Step 5: Multiple changes → prompt or error
  if (quiet) {
    throw new PrerequisiteError(
      `找到多個變更：${changeNames.join(', ')}`,
      '請使用 \`--change <name>\` 指定要使用的變更',
    );
  }

  // Interactive prompt
  const selected = await select({
    message: '請選擇要生成計劃的變更：',
    choices: changeNames.map((name) => ({ name, value: name })),
  });

  return selected;
}
```

**Usage**:

```typescript
const changeName = await resolveChange(cwd, options.change, options.quiet);
// changeName is guaranteed to be valid and unique
```

## Pattern 3: Non-Fatal Error Handling

`archive.service` treats summary generation and knowledge update failures as non-fatal. Archive operation succeeds even if these steps fail.

**Purpose**: Prevent data loss from transient errors. Moving change directory to archive is the critical operation; summary and knowledge updates are enhancements.

**Implementation**:

```typescript
// archive.service.ts
for (const change of candidates) {
  try {
    // CRITICAL: Move to archive (must succeed)
    const archiveDir = await moveToArchive(change, cwd);

    // NICE-TO-HAVE: Generate summary (non-fatal)
    let summaryGenerated = false;
    try {
      const { content, affectedModules } = await generateSummary(
        archiveDir,
        change.name,
        createdDate,
      );
      const summaryPath = path.join(archiveDir, 'summary.md');
      await atomicWrite(summaryPath, content);
      summaryGenerated = true;
      affectedModules.forEach((m) => allAffectedModules.add(m));
    } catch {
      // Summary generation failure is non-fatal
    }

    archived.push({
      name: change.name,
      sourcePath: change.dir,
      archivePath: archiveDir,
      summaryGenerated, // Track success/failure
    });
  } catch {
    skipped.push(change.name);
  }
}

// NICE-TO-HAVE: Auto-trigger knowledge update (non-fatal)
let knowledgeUpdated = false;
if (archived.length > 0) {
  for (const change of archived) {
    const deltaSpecPath = path.join(change.archivePath, 'delta-spec.md');
    if (fs.existsSync(deltaSpecPath)) {
      try {
        await executeKnowledgeUpdate({ deltaSpecPath, cwd });
        knowledgeUpdated = true;
      } catch {
        // Knowledge update failure is non-fatal
      }
    }
  }
}
```

## Pattern 4: ContentMerger for Regeneration

Services that regenerate files use `mergeContent()` from `lib/content-merger` to preserve user-written content.

**Purpose**: Allow re-running knowledge generation commands without losing custom documentation.

**Implementation**:

```typescript
// knowledge.service.ts
async function generateModuleReadme(
  moduleInfo: ModuleInfo,
  readmePath: string,
): Promise<'created' | 'updated'> {
  await ensureDir(path.dirname(readmePath));

  // Render fresh content from template
  const newContent = renderTemplate(
    'steering/module-readme.hbs',
    templateContext,
  );

  // Check if existing file has user content to preserve
  let existingContent = '';
  let action: 'created' | 'updated' = 'created';
  try {
    existingContent = await fs.promises.readFile(readmePath, 'utf-8');
    action = 'updated';
  } catch {
    // File doesn't exist — will create
  }

  // Merge: preserve content between prospec:user-start/end markers
  const finalContent = existingContent
    ? mergeContent(newContent, existingContent)
    : newContent;

  await atomicWrite(readmePath, finalContent);
  return action;
}
```

**Marker format**:

```markdown
<!-- prospec:auto-start -->
(auto-generated content — always replaced)
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
(user-written content — always preserved)
<!-- prospec:user-end -->
```

## Pattern 5: Metadata Status Updates

All change workflow services update `metadata.yaml` status atomically to track workflow progress.

**Purpose**: Provide state tracking for change lifecycle. Enables filtering (e.g., archive only `verified` changes).

**Implementation**:

```typescript
// change-plan.service.ts
async function updateMetadataStatus(
  metadataPath: string,
): Promise<void> {
  if (!fs.existsSync(metadataPath)) return;

  const content = fs.readFileSync(metadataPath, 'utf-8');
  const metadata = parseYaml<ChangeMetadata>(content, metadataPath);
  metadata.status = 'plan'; // Advance status
  const updated = stringifyYaml(metadata);
  await atomicWrite(metadataPath, updated);
}
```

**Status flow**:

```
'story' → 'plan' → 'tasks' → 'verified' → 'archived'
```

**Usage**:

```typescript
// archive.service.ts
export function filterByStatus(
  changes: ChangeEntry[],
  status: ChangeStatus = 'verified',
): ChangeEntry[] {
  return changes.filter((c) => c.status === status);
}
```

## Pattern 6: Delta-Spec Parsing for Incremental Updates

`knowledge-update.service` parses `delta-spec.md` to identify affected modules and update them incrementally.

**Purpose**: Avoid full regeneration of all knowledge files. Only update modules changed in the current change request.

**Implementation**:

```typescript
// knowledge-update.service.ts
export function parseDeltaSpec(content: string): DeltaSpecResult {
  const result: DeltaSpecResult = { added: [], modified: [], removed: [] };

  if (!content || !content.trim()) {
    return result;
  }

  const lines = content.split('\n');
  let currentSection: 'added' | 'modified' | 'removed' | null = null;

  for (const line of lines) {
    // Detect section headers: ## ADDED, ## MODIFIED, ## REMOVED
    const sectionMatch = line.match(/^##\s+(ADDED|MODIFIED|REMOVED)/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1]!.toLowerCase() as 'added' | 'modified' | 'removed';
      continue;
    }

    // Detect REQ ID headers: ### REQ-{MODULE}-{NNN}: Description
    const reqMatch = line.match(/^###\s+(REQ-([\w-]+)-\d{3}):\s*(.*)/);
    if (reqMatch && currentSection) {
      result[currentSection].push({
        id: reqMatch[1]!,           // REQ-SERVICES-020
        module: reqMatch[2]!.toLowerCase(), // services
        description: reqMatch[3]!.trim(),
      });
    }
  }

  return result;
}
```

**Usage**:

```typescript
const deltaContent = await fs.promises.readFile(options.deltaSpecPath, 'utf-8');
const delta = parseDeltaSpec(deltaContent);

// Process ADDED modules
for (const entry of delta.added) {
  const paths = modulePathMap.get(entry.module) ?? [`src/${entry.module}/**`];
  const file = await updateModuleReadme(entry.module, paths, baseOpts);
  result.generatedFiles.push(file);
  if (file.action === 'created') {
    result.created.push(entry.module);
  }
}

// Process MODIFIED modules
for (const entry of delta.modified) {
  const paths = modulePathMap.get(entry.module) ?? [`src/${entry.module}/**`];
  const file = await updateModuleReadme(entry.module, paths, baseOpts);
  result.generatedFiles.push(file);
  if (!result.updated.includes(entry.module)) {
    result.updated.push(entry.module);
  }
}

// Process REMOVED modules
for (const entry of delta.removed) {
  const file = await markModuleDeprecated(
    entry.module,
    entry.description,
    { cwd, knowledgeBasePath },
  );
  if (file) {
    result.generatedFiles.push(file);
    result.deprecated.push(entry.module);
  }
}
```

## Pattern 7: Dry Run Support

Many services support `dryRun` option for preview mode.

**Purpose**: Allow users to preview what would be generated without writing files.

**Implementation**:

```typescript
// steering.service.ts
export async function execute(
  options: SteeringOptions,
): Promise<SteeringResult> {
  const cwd = options.cwd ?? process.cwd();
  const depth = options.depth ?? 10;
  const dryRun = options.dryRun ?? false;

  // ... perform detection and build results

  const outputFiles: string[] = [];

  if (!dryRun) {
    // 7a. Write module-map.yaml
    await atomicWrite(moduleMapPath, moduleMapContent);
    outputFiles.push(path.join(knowledgeBasePath, 'module-map.yaml'));

    // 7b. Write architecture.md
    await atomicWrite(architecturePath, architectureContent);
    outputFiles.push(path.join(knowledgeBasePath, 'architecture.md'));

    // 7c. Update .prospec.yaml
    await writeConfig(updatedConfig, cwd);
    outputFiles.push('.prospec.yaml');
  }

  return {
    fileCount: scanResult.count,
    moduleCount: detection.modules.length,
    architecture: detection.architecture,
    entryPoints: detection.entryPoints,
    modules: [...],
    outputFiles,
    dryRun,
  };
}
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
