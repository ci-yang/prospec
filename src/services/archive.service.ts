import * as fs from 'node:fs';
import * as path from 'node:path';
import { readConfig } from '../lib/config.js';
import { ensureDir, atomicWrite } from '../lib/fs-utils.js';
import { parseYaml, stringifyYaml } from '../lib/yaml-utils.js';
import type { ChangeStatus } from '../types/change.js';
import { ScanError, WriteError } from '../types/errors.js';
import { execute as executeKnowledgeUpdate } from './knowledge-update.service.js';

// --- Interfaces (Task 5) ---

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

  for (const change of candidates) {
    try {
      const createdDate = String(change.metadata.created ?? change.metadata.created_at ?? 'unknown');

      // Move to archive
      const archiveDir = await moveToArchive(change, cwd);

      // Generate summary
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
