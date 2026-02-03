import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { vol } from 'memfs';
import { atomicWrite, ensureDir, fileExists } from '../../../src/lib/fs-utils.js';
import { WriteError } from '../../../src/types/errors.js';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

describe('atomicWrite', () => {
  it('should write content to a file', async () => {
    vol.fromJSON({ '/tmp': null }, '/');
    await atomicWrite('/tmp/test.txt', 'hello world');
    const content = fs.readFileSync('/tmp/test.txt', 'utf-8');
    expect(content).toBe('hello world');
  });

  it('should create parent directories if they do not exist', async () => {
    vol.fromJSON({}, '/');
    await atomicWrite('/tmp/nested/deep/file.txt', 'content');
    const content = fs.readFileSync('/tmp/nested/deep/file.txt', 'utf-8');
    expect(content).toBe('content');
  });

  it('should overwrite existing files', async () => {
    vol.fromJSON({ '/tmp/file.txt': 'old content' }, '/');
    await atomicWrite('/tmp/file.txt', 'new content');
    const content = fs.readFileSync('/tmp/file.txt', 'utf-8');
    expect(content).toBe('new content');
  });

  it('should throw WriteError on failure', async () => {
    // Mock a read-only scenario by using an invalid path
    vol.fromJSON({}, '/');
    // memfs doesn't truly enforce permissions, so we mock rename to fail
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockRejectedValueOnce(
      new Error('EACCES: permission denied'),
    );
    await expect(atomicWrite('/readonly/file.txt', 'content')).rejects.toThrow(WriteError);
    renameSpy.mockRestore();
  });
});

describe('ensureDir', () => {
  it('should create a directory recursively', async () => {
    vol.fromJSON({}, '/');
    await ensureDir('/tmp/a/b/c');
    const stat = fs.statSync('/tmp/a/b/c');
    expect(stat.isDirectory()).toBe(true);
  });

  it('should not throw if directory already exists', async () => {
    vol.fromJSON({}, '/');
    fs.mkdirSync('/tmp/existing', { recursive: true });
    await expect(ensureDir('/tmp/existing')).resolves.toBeUndefined();
  });
});

describe('fileExists', () => {
  it('should return true for existing files', () => {
    vol.fromJSON({ '/tmp/exists.txt': 'data' }, '/');
    expect(fileExists('/tmp/exists.txt')).toBe(true);
  });

  it('should return false for non-existing files', () => {
    vol.fromJSON({}, '/');
    expect(fileExists('/tmp/nope.txt')).toBe(false);
  });

  it('should return true for directories', () => {
    vol.fromJSON({}, '/');
    fs.mkdirSync('/tmp/dir', { recursive: true });
    expect(fileExists('/tmp/dir')).toBe(true);
  });
});
