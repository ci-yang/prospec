/**
 * Integration test: change management flow.
 *
 * Tests the complete change flow: story → plan → tasks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { vol } from 'memfs';
import { execute as storyExecute } from '../../src/services/change-story.service.js';
import { execute as planExecute } from '../../src/services/change-plan.service.js';
import { execute as tasksExecute } from '../../src/services/change-tasks.service.js';
import { PrerequisiteError } from '../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

vi.mock('../../src/lib/template.js', () => ({
  renderTemplate: vi.fn().mockImplementation((templateName: string) => {
    if (templateName.includes('metadata')) {
      return 'name: test\nstatus: story\ncreated_at: "2026-01-01T00:00:00.000Z"\nrelated_modules: []\ndescription: Test\n';
    }
    if (templateName.includes('proposal')) {
      return '# Proposal\n\nAs a developer...\n';
    }
    if (templateName.includes('plan.md')) {
      return '# Plan\n\n## Implementation Steps\n';
    }
    if (templateName.includes('delta-spec')) {
      return '# Delta Spec\n\n## ADDED\n';
    }
    if (templateName.includes('tasks.md')) {
      return '# Tasks\n\n- [ ] T1 First task\n';
    }
    return '# Template Content\n';
  }),
  registerPartial: vi.fn(),
  registerPartialFromFile: vi.fn(),
  registerHelper: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
});

describe('Change Management Flow Integration', () => {
  it('should complete the full story → plan → tasks workflow', async () => {
    // Setup: create .prospec.yaml
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    // Step 1: Create story
    const storyResult = await storyExecute({
      name: 'add-feature',
      description: 'A new feature',
      cwd: '/project',
    });
    expect(storyResult.changeName).toBe('add-feature');
    expect(fs.existsSync('/project/.prospec/changes/add-feature/proposal.md')).toBe(true);
    expect(fs.existsSync('/project/.prospec/changes/add-feature/metadata.yaml')).toBe(true);

    // Step 2: Create plan
    const planResult = await planExecute({
      change: 'add-feature',
      cwd: '/project',
    });
    expect(planResult.changeName).toBe('add-feature');
    expect(fs.existsSync('/project/.prospec/changes/add-feature/plan.md')).toBe(true);
    expect(fs.existsSync('/project/.prospec/changes/add-feature/delta-spec.md')).toBe(true);

    // Verify metadata status updated to 'plan'
    const metadataAfterPlan = fs.readFileSync(
      '/project/.prospec/changes/add-feature/metadata.yaml',
      'utf-8',
    );
    expect(metadataAfterPlan).toContain('plan');

    // Step 3: Create tasks
    const tasksResult = await tasksExecute({
      change: 'add-feature',
      cwd: '/project',
    });
    expect(tasksResult.changeName).toBe('add-feature');
    expect(fs.existsSync('/project/.prospec/changes/add-feature/tasks.md')).toBe(true);

    // Verify metadata status updated to 'tasks'
    const metadataAfterTasks = fs.readFileSync(
      '/project/.prospec/changes/add-feature/metadata.yaml',
      'utf-8',
    );
    expect(metadataAfterTasks).toContain('tasks');
  });

  it('should not allow plan without story', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });
    // Create change dir but no proposal.md
    vol.mkdirSync('/project/.prospec/changes/no-story', { recursive: true });

    await expect(
      planExecute({ change: 'no-story', cwd: '/project' }),
    ).rejects.toThrow(PrerequisiteError);
  });

  it('should not allow tasks without plan', async () => {
    vol.fromJSON({
      '/project/.prospec.yaml': 'project:\n  name: test\n',
    });

    // Create story first
    await storyExecute({
      name: 'partial-flow',
      cwd: '/project',
    });

    // Try tasks without plan
    await expect(
      tasksExecute({ change: 'partial-flow', cwd: '/project' }),
    ).rejects.toThrow(PrerequisiteError);
  });
});
