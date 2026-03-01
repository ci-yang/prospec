import * as fs from 'node:fs';
import * as path from 'node:path';
import { ensureDir, atomicWrite } from '../lib/fs-utils.js';
import { readConfig, resolveBasePaths } from '../lib/config.js';
import { parseYaml, stringifyYaml } from '../lib/yaml-utils.js';
import type { ChangeStatus } from '../types/change.js';
import { ScanError, WriteError } from '../types/errors.js';
import { execute as executeKnowledgeUpdate } from './knowledge-update.service.js';

// --- Interfaces ---

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
  specFiles: string[];
}

export interface ArchivedChange {
  name: string;
  sourcePath: string;
  archivePath: string;
  summaryGenerated: boolean;
}

/** Routing info extracted from delta-spec Feature/Story fields. */
export interface FeatureRoute {
  reqId: string;
  feature: string;
  story: string;
  status: 'ADDED' | 'MODIFIED' | 'REMOVED';
  description: string;
}

// --- Core functions ---

/**
 * Scan .prospec/changes/ for all change directories with metadata.yaml.
 */
export async function scanChanges(cwd: string): Promise<ChangeEntry[]> {
  const changesDir = path.join(cwd, '.prospec', 'changes');

  if (!fs.existsSync(changesDir)) {
    return [];
  }

  let entries: string[];
  try {
    entries = await fs.promises.readdir(changesDir);
  } catch (err) {
    throw new ScanError(changesDir, err instanceof Error ? err.message : String(err));
  }

  const changes: ChangeEntry[] = [];

  for (const entry of entries) {
    const changeDir = path.join(changesDir, entry);
    const metadataPath = path.join(changeDir, 'metadata.yaml');

    // Skip non-directories
    const stat = await fs.promises.stat(changeDir).catch(() => null);
    if (!stat?.isDirectory()) continue;

    // Skip directories without metadata.yaml
    if (!fs.existsSync(metadataPath)) continue;

    try {
      const content = await fs.promises.readFile(metadataPath, 'utf-8');
      const metadata = parseYaml<Record<string, unknown>>(content, metadataPath);
      changes.push({
        name: entry,
        dir: changeDir,
        metadata,
        status: String(metadata.status ?? 'unknown'),
      });
    } catch {
      // Skip changes with unparseable metadata
      continue;
    }
  }

  return changes;
}

/**
 * Filter changes by status.
 */
export function filterByStatus(
  changes: ChangeEntry[],
  status: ChangeStatus = 'verified',
): ChangeEntry[] {
  return changes.filter((c) => c.status === status);
}

/**
 * Move a change directory to .prospec/archive/{YYYY-MM-DD}-{name}/.
 */
export async function moveToArchive(
  change: ChangeEntry,
  cwd: string,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const archiveName = `${today}-${change.name}`;
  const archiveDir = path.join(cwd, '.prospec', 'archive', archiveName);

  if (fs.existsSync(archiveDir)) {
    throw new WriteError(archiveDir, 'Archive directory already exists');
  }

  await ensureDir(archiveDir);

  // Move all files from change directory to archive
  const files = await fs.promises.readdir(change.dir);
  for (const file of files) {
    const src = path.join(change.dir, file);
    const dest = path.join(archiveDir, file);
    await fs.promises.rename(src, dest);
  }

  // Remove the now-empty source directory
  await fs.promises.rmdir(change.dir);

  return archiveDir;
}

/**
 * Generate summary.md from proposal.md and delta-spec.md.
 * Returns the summary content string and list of affected modules.
 */
export async function generateSummary(
  archiveDir: string,
  changeName: string,
  createdDate: string,
): Promise<{ content: string; affectedModules: string[] }> {
  // Read proposal.md for User Story
  const proposalPath = path.join(archiveDir, 'proposal.md');
  let userStory = 'N/A';
  if (fs.existsSync(proposalPath)) {
    const proposalContent = await fs.promises.readFile(proposalPath, 'utf-8');
    userStory = extractUserStory(proposalContent);
  }

  // Read delta-spec.md for REQ IDs and affected modules
  const deltaSpecPath = path.join(archiveDir, 'delta-spec.md');
  let reqTable = 'No delta-spec.md found.';
  let moduleTable = 'No delta-spec.md found.';
  const affectedModules: string[] = [];

  if (fs.existsSync(deltaSpecPath)) {
    const deltaContent = await fs.promises.readFile(deltaSpecPath, 'utf-8');
    const reqs = extractRequirements(deltaContent);
    const modules = extractAffectedModules(deltaContent);
    affectedModules.push(...modules.map((m) => m.name));

    if (reqs.length > 0) {
      reqTable = '| REQ ID | Status | Description |\n|--------|--------|-------------|\n'
        + reqs.map((r) => `| ${r.id} | ${r.status} | ${r.description} |`).join('\n');
    }

    if (modules.length > 0) {
      moduleTable = '| Module | Impact | Description |\n|--------|--------|-------------|\n'
        + modules.map((m) => `| ${m.name} | ${m.impact} | ${m.description} |`).join('\n');
    }
  }

  // Read tasks.md for completion stats
  const tasksPath = path.join(archiveDir, 'tasks.md');
  let taskStats = 'N/A';
  if (fs.existsSync(tasksPath)) {
    const tasksContent = await fs.promises.readFile(tasksPath, 'utf-8');
    taskStats = calculateTaskStats(tasksContent);
  }

  // Read metadata for quality grade
  const metadataPath = path.join(archiveDir, 'metadata.yaml');
  let qualityGrade = 'Unverified';
  if (fs.existsSync(metadataPath)) {
    const metaContent = await fs.promises.readFile(metadataPath, 'utf-8');
    const meta = parseYaml<Record<string, unknown>>(metaContent, metadataPath);
    if (meta.quality_grade) {
      qualityGrade = String(meta.quality_grade);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const content = `# ${changeName} — Archive Summary

- **Archived**: ${today}
- **Original Created**: ${createdDate}
- **Quality Grade**: ${qualityGrade}

## User Story

${userStory}

## Affected Modules

${moduleTable}

## Requirements

${reqTable}

## Completion

- **Tasks**: ${taskStats}
`;

  return { content, affectedModules };
}

/**
 * Sync delta-spec requirements to Feature Specs in specs/features/.
 * Routes each requirement by its **Feature** field to the correct Feature Spec file.
 * Returns list of created/updated Feature Spec file paths.
 */
export async function syncToFeatureSpecs(
  archiveDir: string,
  featuresPath: string,
): Promise<string[]> {
  const deltaSpecPath = path.join(archiveDir, 'delta-spec.md');
  if (!fs.existsSync(deltaSpecPath)) return [];

  const deltaContent = await fs.promises.readFile(deltaSpecPath, 'utf-8');
  const routes = extractFeatureRoutes(deltaContent);
  if (routes.length === 0) return [];

  await ensureDir(featuresPath);

  // Group routes by feature slug
  const byFeature = new Map<string, FeatureRoute[]>();
  for (const route of routes) {
    const existing = byFeature.get(route.feature) ?? [];
    existing.push(route);
    byFeature.set(route.feature, existing);
  }

  const updatedFiles: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const [feature, featureRoutes] of byFeature) {
    const specFile = path.join(featuresPath, `${feature}.md`);
    const fileExists = fs.existsSync(specFile);

    if (fileExists) {
      let content = await fs.promises.readFile(specFile, 'utf-8');

      for (const route of featureRoutes) {
        if (route.status === 'REMOVED') {
          content = moveReqToDeprecated(content, route);
        } else {
          content = mergeRequirementInPlace(content, route);
        }
      }

      content = updateFeatureSpecFrontmatter(content, today);
      content = appendToChangeHistory(content, featureRoutes, today);
      await atomicWrite(specFile, content);
    } else {
      const content = createNewFeatureSpec(feature, featureRoutes, today);
      await atomicWrite(specFile, content);
    }

    updatedFiles.push(specFile);
  }

  return updatedFiles;
}

/**
 * Generate product.md by scanning all Feature Specs' frontmatter.
 * Synthesizes a product overview with feature map and P0 stories summary.
 */
export async function generateProductSpec(
  featuresPath: string,
  productSpecPath: string,
  projectName: string,
): Promise<string> {
  const features: Array<{ slug: string; title: string; status: string; storyCount: number }> = [];

  if (fs.existsSync(featuresPath)) {
    const files = await fs.promises.readdir(featuresPath);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(featuresPath, file);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const frontmatter = parseFeatureSpecFrontmatter(content);
      if (frontmatter) {
        features.push({
          slug: file.replace(/\.md$/, ''),
          title: frontmatter.feature,
          status: frontmatter.status,
          storyCount: frontmatter.storyCount,
        });
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const featureMap = features
    .filter((f) => f.status === 'active')
    .map((f) => `### ${f.title}\n→ [features/${f.slug}.md](features/${f.slug}.md)`)
    .join('\n\n');

  const content = `---
product: ${projectName}
last_updated: ${today}
---

# ${projectName}

## 功能地圖

${featureMap || '_(No active features yet)_'}
`;

  await ensureDir(path.dirname(productSpecPath));
  await atomicWrite(productSpecPath, content);
  return productSpecPath;
}

/**
 * Main archive execution flow.
 */
export async function execute(options: ArchiveOptions): Promise<ArchiveResult> {
  const cwd = options.cwd ?? process.cwd();
  const targetStatus = options.status ?? 'verified';

  // 1. Scan all changes
  const allChanges = await scanChanges(cwd);

  // 2. Filter by status
  let candidates = filterByStatus(allChanges, targetStatus);

  // 3. Filter by name if specified
  if (options.names && options.names.length > 0) {
    candidates = candidates.filter((c) => options.names!.includes(c.name));
  }

  const archived: ArchivedChange[] = [];
  const skipped: string[] = [];
  const allAffectedModules = new Set<string>();
  const specFiles: string[] = [];

  // Resolve specsPath from config (non-fatal if config is missing)
  // Feature Specs go to specs/features/ subdirectory
  let featuresPath: string | null = null;
  let productSpecPath: string | null = null;
  let projectName = 'project';
  try {
    const config = await readConfig(cwd);
    const basePaths = resolveBasePaths(config, cwd);
    featuresPath = path.join(basePaths.specsPath, 'features');
    productSpecPath = path.join(basePaths.specsPath, 'product.md');
    projectName = config.project?.name ?? 'project';
  } catch {
    // Config not available — skip Feature Spec sync
  }

  for (const change of candidates) {
    try {
      const createdDate = String(change.metadata.created ?? change.metadata.created_at ?? 'unknown');

      // Move to archive
      const archiveDir = await moveToArchive(change, cwd);

      // Generate summary
      let summaryGenerated = false;
      let summaryContent: string | null = null;
      try {
        const { content, affectedModules } = await generateSummary(
          archiveDir,
          change.name,
          createdDate,
        );
        const summaryPath = path.join(archiveDir, 'summary.md');
        await atomicWrite(summaryPath, content);
        summaryGenerated = true;
        summaryContent = content;
        affectedModules.forEach((m) => allAffectedModules.add(m));
      } catch {
        // Summary generation failure is non-fatal
      }

      // Sync requirements to Feature Specs (non-fatal)
      if (featuresPath) {
        try {
          const syncedFiles = await syncToFeatureSpecs(archiveDir, featuresPath);
          specFiles.push(...syncedFiles);
        } catch {
          // Feature Spec sync failure is non-fatal
        }
      }

      // Update metadata to archived
      const metadataPath = path.join(archiveDir, 'metadata.yaml');
      if (fs.existsSync(metadataPath)) {
        const metaContent = await fs.promises.readFile(metadataPath, 'utf-8');
        const meta = parseYaml<Record<string, unknown>>(metaContent, metadataPath);
        meta.status = 'archived';
        meta.archived_at = new Date().toISOString().slice(0, 10);
        await atomicWrite(metadataPath, stringifyYaml(meta));
      }

      archived.push({
        name: change.name,
        sourcePath: change.dir,
        archivePath: archiveDir,
        summaryGenerated,
      });
    } catch {
      skipped.push(change.name);
    }
  }

  // Regenerate product.md from Feature Specs (non-fatal)
  if (archived.length > 0 && featuresPath && productSpecPath) {
    try {
      await generateProductSpec(featuresPath, productSpecPath, projectName);
    } catch {
      // Product Spec regeneration failure is non-fatal
    }
  }

  // Auto-trigger incremental Knowledge update (non-fatal)
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

  return {
    archived,
    skipped,
    affectedModules: [...allAffectedModules],
    knowledgeUpdated,
    specFiles,
  };
}

// --- Internal helpers ---

function extractUserStory(proposalContent: string): string {
  const lines = proposalContent.split('\n');
  let capturing = false;
  const storyLines: string[] = [];

  for (const line of lines) {
    if (/^##\s+User Story/i.test(line)) {
      capturing = true;
      continue;
    }
    if (capturing && /^##\s/.test(line)) {
      break;
    }
    if (capturing) {
      storyLines.push(line);
    }
  }

  const story = storyLines.join('\n').trim();
  return story || 'N/A';
}

function extractRequirements(deltaContent: string): Array<{ id: string; status: string; description: string }> {
  const reqs: Array<{ id: string; status: string; description: string }> = [];
  const lines = deltaContent.split('\n');

  let currentSection = '';
  for (const line of lines) {
    if (/^##\s+(ADDED|MODIFIED|REMOVED)/i.test(line)) {
      currentSection = line.replace(/^##\s+/, '').trim().toUpperCase();
    }
    // Match REQ IDs in h3 headers: ### REQ-XXX-NNN: description
    const reqMatch = line.match(/^###\s+(REQ-[\w-]+):\s*(.*)/);
    if (reqMatch) {
      reqs.push({
        id: reqMatch[1]!,
        status: currentSection || 'UNKNOWN',
        description: reqMatch[2]!.trim(),
      });
    }
  }

  return reqs;
}

function extractAffectedModules(deltaContent: string): Array<{ name: string; impact: string; description: string }> {
  const modules: Array<{ name: string; impact: string; description: string }> = [];

  // Extract module names from REQ IDs (e.g., REQ-TYPES-010 → types)
  const moduleSet = new Map<string, string>();
  const lines = deltaContent.split('\n');

  for (const line of lines) {
    const reqMatch = line.match(/^###\s+REQ-([\w]+)-\d+:\s*(.*)/);
    if (reqMatch) {
      const moduleName = reqMatch[1]!.toLowerCase();
      if (!moduleSet.has(moduleName)) {
        moduleSet.set(moduleName, reqMatch[2]!.trim());
      }
    }
  }

  for (const [name, description] of moduleSet) {
    modules.push({ name, impact: 'Modified', description });
  }

  return modules;
}

function calculateTaskStats(tasksContent: string): string {
  const completed = (tasksContent.match(/- \[x\]/gi) ?? []).length;
  const total = (tasksContent.match(/- \[[ x]\]/gi) ?? []).length;

  if (total === 0) return 'No tasks found';

  const pct = Math.round((completed / total) * 100);
  return `${completed}/${total} (${pct}%)`;
}

/**
 * Extract Feature routing info from delta-spec.md.
 * Parses **Feature** and **Story** fields under each REQ header.
 */
function extractFeatureRoutes(deltaContent: string): FeatureRoute[] {
  const routes: FeatureRoute[] = [];
  const lines = deltaContent.split('\n');

  let currentSection = '';
  let currentReqId = '';
  let currentDescription = '';
  let currentFeature = '';
  let currentStory = '';

  const pushCurrent = () => {
    if (currentReqId && currentFeature) {
      routes.push({
        reqId: currentReqId,
        feature: currentFeature,
        story: currentStory,
        status: currentSection as FeatureRoute['status'],
        description: currentDescription,
      });
    }
  };

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(ADDED|MODIFIED|REMOVED)/i);
    if (sectionMatch) {
      pushCurrent();
      currentSection = sectionMatch[1]!.toUpperCase();
      currentReqId = '';
      currentFeature = '';
      currentStory = '';
      continue;
    }

    const reqMatch = line.match(/^###\s+(REQ-[\w-]+):\s*(.*)/);
    if (reqMatch) {
      pushCurrent();
      currentReqId = reqMatch[1]!;
      currentDescription = reqMatch[2]!.trim();
      currentFeature = '';
      currentStory = '';
      continue;
    }

    const featureMatch = line.match(/^\*\*Feature:\*\*\s*(.+)/);
    if (featureMatch) {
      currentFeature = featureMatch[1]!.trim();
      continue;
    }

    const storyMatch = line.match(/^\*\*Story:\*\*\s*(.+)/);
    if (storyMatch) {
      currentStory = storyMatch[1]!.trim();
      continue;
    }
  }

  pushCurrent();
  return routes;
}

/**
 * Merge a requirement into an existing Feature Spec (ADDED or MODIFIED).
 * For MODIFIED: replaces the existing REQ section in-place.
 * For ADDED: appends under the User Stories section.
 */
function mergeRequirementInPlace(content: string, route: FeatureRoute): string {
  const reqHeader = `#### ${route.reqId}:`;

  if (route.status === 'MODIFIED' && content.includes(reqHeader)) {
    // Replace existing REQ section (from header to next h4 or h3 or section end)
    const lines = content.split('\n');
    const result: string[] = [];
    let skipping = false;

    for (const line of lines) {
      if (line.startsWith(reqHeader)) {
        // Replace with updated content
        result.push(`#### ${route.reqId}: ${route.description}`);
        result.push('');
        skipping = true;
        continue;
      }
      if (skipping && /^#{3,4}\s/.test(line)) {
        skipping = false;
      }
      if (!skipping) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  // ADDED: append before Edge Cases or at end of User Stories section
  const insertBefore = '## Edge Cases';
  const newReq = `\n#### ${route.reqId}: ${route.description}\n\n---\n`;

  if (content.includes(insertBefore)) {
    return content.replace(insertBefore, newReq + '\n' + insertBefore);
  }

  // Fallback: append at end
  return content + newReq;
}

/**
 * Move a requirement to the Deprecated section (REMOVED).
 */
function moveReqToDeprecated(content: string, route: FeatureRoute): string {
  const today = new Date().toISOString().slice(0, 10);
  const deprecatedEntry = `\n- **${route.reqId}**: ${route.description} _(removed ${today})_`;

  // Replace _(None)_ placeholder if present
  if (content.includes('## Deprecated Requirements\n\n_(None)_')) {
    return content.replace(
      '## Deprecated Requirements\n\n_(None)_',
      `## Deprecated Requirements\n${deprecatedEntry}`,
    );
  }

  // Append to existing Deprecated section
  if (content.includes('## Deprecated Requirements')) {
    return content.replace(
      '## Deprecated Requirements',
      `## Deprecated Requirements${deprecatedEntry}`,
    );
  }

  // No Deprecated section — append at end
  return content + `\n## Deprecated Requirements\n${deprecatedEntry}\n`;
}

/**
 * Update Feature Spec frontmatter counters.
 */
function updateFeatureSpecFrontmatter(content: string, today: string): string {
  // Update last_updated
  return content.replace(
    /^last_updated:\s*.+$/m,
    `last_updated: ${today}`,
  );
}

/**
 * Append entries to the Change History table.
 */
function appendToChangeHistory(
  content: string,
  routes: FeatureRoute[],
  today: string,
): string {
  const refsStr = routes.map((r) => r.reqId).join(', ');
  const impact = routes.map((r) => `${r.status} ${r.reqId}`).join('; ');
  const historyRow = `| ${today} | archive-sync | ${impact} | ${refsStr} |`;

  // Insert before the last line of the Change History table (or at end of section)
  if (content.includes('## Change History')) {
    const lines = content.split('\n');
    const result: string[] = [];
    let inserted = false;

    for (let i = 0; i < lines.length; i++) {
      result.push(lines[i]!);
      // Insert after the table header separator row (|------|...)
      if (
        !inserted
        && lines[i]!.includes('|------')
        && i > 0
        && lines[i - 1]!.includes('| Date')
      ) {
        result.push(historyRow);
        inserted = true;
      }
    }

    if (!inserted) {
      // Fallback: append after Change History heading
      return content + '\n' + historyRow;
    }

    return result.join('\n');
  }

  return content;
}

/**
 * Create a new Feature Spec file from scratch.
 */
function createNewFeatureSpec(
  feature: string,
  routes: FeatureRoute[],
  today: string,
): string {
  const stories = [...new Set(routes.map((r) => r.story).filter(Boolean))];
  const reqSections = routes
    .filter((r) => r.status !== 'REMOVED')
    .map((r) => `#### ${r.reqId}: ${r.description}\n\n---`)
    .join('\n\n');

  const deprecatedSection = routes
    .filter((r) => r.status === 'REMOVED')
    .map((r) => `- **${r.reqId}**: ${r.description} _(removed ${today})_`)
    .join('\n');

  return `---
feature: ${feature}
status: active
last_updated: ${today}
story_count: ${stories.length}
req_count: ${routes.filter((r) => r.status !== 'REMOVED').length}
---

# ${feature}

## Who & Why

**服務對象**: TBD

**解決問題**: TBD

**為什麼重要**: TBD

## User Stories & Behavior Specifications

${reqSections}

## Edge Cases

_(TBD)_

## Success Criteria

_(TBD)_

## Maintenance Rules

1. **Replace-in-Place**: MODIFIED User Stories and REQs directly replace existing versions
2. **Functional Grouping**: New requirements insert under the corresponding User Story
3. **No Inline Provenance**: Historical attribution only in Change History table
4. **Deprecation over Deletion**: Removed requirements move to Deprecated section

## Deprecated Requirements

${deprecatedSection || '_(None)_'}

## Change History

| Date | Change | Impact | Stories/REQs |
|------|--------|--------|-------------|
| ${today} | initial-sync | Created from archive | ${routes.map((r) => r.reqId).join(', ')} |
`;
}

/**
 * Parse Feature Spec frontmatter fields.
 */
function parseFeatureSpecFrontmatter(
  content: string,
): { feature: string; status: string; storyCount: number } | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1]!;
  const featureMatch = fm.match(/^feature:\s*(.+)$/m);
  const statusMatch = fm.match(/^status:\s*(.+)$/m);
  const storyCountMatch = fm.match(/^story_count:\s*(\d+)$/m);

  if (!featureMatch) return null;

  return {
    feature: featureMatch[1]!.trim(),
    status: statusMatch?.[1]?.trim() ?? 'active',
    storyCount: storyCountMatch ? parseInt(storyCountMatch[1]!, 10) : 0,
  };
}
