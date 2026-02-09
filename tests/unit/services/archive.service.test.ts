import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import {
  scanChanges,
  filterByStatus,
  moveToArchive,
  generateSummary,
  execute,
} from '../../../src/services/archive.service.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

// --- scanChanges ---

describe('scanChanges', () => {
  it('should return empty array for empty changes directory', async () => {
    vol.fromJSON({});
    vol.mkdirSync('/project/.prospec/changes', { recursive: true });

    const result = await scanChanges('/project');
    expect(result).toEqual([]);
  });

  it('should return empty array when changes directory does not exist', async () => {
    vol.fromJSON({});
    vol.mkdirSync('/project', { recursive: true });

    const result = await scanChanges('/project');
    expect(result).toEqual([]);
  });

  it('should scan multiple changes with metadata', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: verified\ncreated: "2026-01-01"\n',
      '/project/.prospec/changes/feat-b/metadata.yaml': 'name: feat-b\nstatus: tasks\ncreated: "2026-01-02"\n',
    });

    const result = await scanChanges('/project');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name).sort()).toEqual(['feat-a', 'feat-b']);
  });

  it('should skip directories without metadata.yaml', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: verified\n',
      '/project/.prospec/changes/feat-b/proposal.md': '# no metadata here\n',
    });

    const result = await scanChanges('/project');
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('feat-a');
  });
});

// --- filterByStatus ---

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

// --- moveToArchive ---

describe('moveToArchive', () => {
  it('should create archive directory with date prefix', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: verified\n',
      '/project/.prospec/changes/feat-a/proposal.md': '# Proposal\n',
    });

    const change = {
      name: 'feat-a',
      dir: '/project/.prospec/changes/feat-a',
      metadata: { status: 'verified' },
      status: 'verified',
    };

    const archiveDir = await moveToArchive(change, '/project');

    // Archive dir should have date prefix pattern
    expect(archiveDir).toMatch(/\.prospec\/archive\/\d{4}-\d{2}-\d{2}-feat-a/);
    expect(fs.existsSync(archiveDir)).toBe(true);
  });

  it('should move all files to archive directory', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: verified\n',
      '/project/.prospec/changes/feat-a/proposal.md': '# Proposal\n',
      '/project/.prospec/changes/feat-a/plan.md': '# Plan\n',
    });

    const change = {
      name: 'feat-a',
      dir: '/project/.prospec/changes/feat-a',
      metadata: { status: 'verified' },
      status: 'verified',
    };

    const archiveDir = await moveToArchive(change, '/project');

    expect(fs.existsSync(`${archiveDir}/metadata.yaml`)).toBe(true);
    expect(fs.existsSync(`${archiveDir}/proposal.md`)).toBe(true);
    expect(fs.existsSync(`${archiveDir}/plan.md`)).toBe(true);

    // Source directory should be removed
    expect(fs.existsSync('/project/.prospec/changes/feat-a')).toBe(false);
  });

  it('should use YYYY-MM-DD date format', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'status: verified\n',
    });

    const change = {
      name: 'feat-a',
      dir: '/project/.prospec/changes/feat-a',
      metadata: { status: 'verified' },
      status: 'verified',
    };

    const archiveDir = await moveToArchive(change, '/project');
    const dirName = archiveDir.split('/').pop()!;
    expect(dirName).toMatch(/^\d{4}-\d{2}-\d{2}-feat-a$/);
  });
});

// --- generateSummary ---

describe('generateSummary', () => {
  it('should extract User Story from proposal.md', async () => {
    vol.fromJSON({
      '/archive/proposal.md': `# Proposal

## User Story

As a developer,
I want automated archiving,
So that my changes directory stays clean.

## Acceptance Criteria

1. Archive works
`,
      '/archive/metadata.yaml': 'status: verified\n',
    });

    const { content } = await generateSummary('/archive', 'feat-a', '2026-01-01');
    expect(content).toContain('As a developer');
    expect(content).toContain('automated archiving');
  });

  it('should extract REQ IDs from delta-spec.md', async () => {
    vol.fromJSON({
      '/archive/delta-spec.md': `# Delta Spec

## ADDED

### REQ-TYPES-010: Add archived status

Description here.

### REQ-SERVICES-010: Archive service

Description here.

## MODIFIED

None
`,
      '/archive/metadata.yaml': 'status: verified\n',
    });

    const { content, affectedModules } = await generateSummary('/archive', 'feat-a', '2026-01-01');
    expect(content).toContain('REQ-TYPES-010');
    expect(content).toContain('REQ-SERVICES-010');
    expect(affectedModules).toContain('types');
    expect(affectedModules).toContain('services');
  });

  it('should calculate task completion stats', async () => {
    vol.fromJSON({
      '/archive/tasks.md': `# Tasks

- [x] Task 1
- [x] Task 2
- [ ] Task 3
`,
      '/archive/metadata.yaml': 'status: verified\n',
    });

    const { content } = await generateSummary('/archive', 'feat-a', '2026-01-01');
    expect(content).toContain('2/3');
    expect(content).toContain('67%');
  });

  it('should handle missing proposal.md gracefully', async () => {
    vol.fromJSON({
      '/archive/metadata.yaml': 'status: verified\n',
    });

    const { content } = await generateSummary('/archive', 'feat-a', '2026-01-01');
    expect(content).toContain('feat-a');
    expect(content).toContain('N/A');
  });
});

// --- execute ---

describe('execute', () => {
  it('should archive verified changes and update metadata to archived', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: verified\ncreated: "2026-01-01"\n',
      '/project/.prospec/changes/feat-a/proposal.md': `# Proposal

## User Story

As a dev, I want X, so that Y.
`,
      '/project/.prospec/changes/feat-a/delta-spec.md': `# Delta Spec

## ADDED

### REQ-TYPES-001: Some type change

Details.
`,
      '/project/.prospec/changes/feat-a/tasks.md': '- [x] Task 1\n- [x] Task 2\n',
    });

    const result = await execute({ cwd: '/project' });

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

  it('should skip non-verified changes by default', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: tasks\ncreated: "2026-01-01"\n',
    });

    const result = await execute({ cwd: '/project' });
    expect(result.archived).toHaveLength(0);
  });

  it('should archive changes with specified status', async () => {
    vol.fromJSON({
      '/project/.prospec/changes/feat-a/metadata.yaml': 'name: feat-a\nstatus: tasks\ncreated: "2026-01-01"\n',
    });

    const result = await execute({ cwd: '/project', status: 'tasks' });
    expect(result.archived).toHaveLength(1);
  });
});
