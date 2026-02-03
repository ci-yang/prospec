import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanDir, scanDirSync } from '../../../src/lib/scanner.js';

// scanner uses fast-glob directly, so we test with real filesystem using temp dirs
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prospec-scanner-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Helper to create files in tmpDir
function createFiles(files: Record<string, string>) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
}


describe('scanDir', () => {
  it('should scan all files in a directory', async () => {
    createFiles({
      'src/index.ts': '',
      'src/app.ts': '',
      'README.md': '',
    });
    const result = await scanDir('**', { cwd: tmpDir });
    expect(result.count).toBe(3);
    expect(result.files).toContain('src/index.ts');
    expect(result.files).toContain('README.md');
  });

  it('should exclude node_modules by default', async () => {
    createFiles({
      'src/index.ts': '',
      'node_modules/pkg/index.js': '',
    });
    const result = await scanDir('**', { cwd: tmpDir });
    expect(result.files).not.toContain('node_modules/pkg/index.js');
  });

  it('should exclude sensitive files by default', async () => {
    createFiles({
      'src/index.ts': '',
      '.env': 'SECRET=123',
      '.env.local': 'SECRET=456',
      'credentials.json': '{}',
    });
    const result = await scanDir('**', { cwd: tmpDir });
    expect(result.files).not.toContain('.env');
    expect(result.files).not.toContain('.env.local');
    expect(result.files).not.toContain('credentials.json');
  });

  it('should respect depth option', async () => {
    createFiles({
      'a/b/c/deep.ts': '',
      'a/shallow.ts': '',
    });
    const result = await scanDir('**', { cwd: tmpDir, depth: 2 });
    expect(result.files).toContain('a/shallow.ts');
    expect(result.files).not.toContain('a/b/c/deep.ts');
  });

  it('should support custom exclude patterns', async () => {
    createFiles({
      'src/index.ts': '',
      'src/generated/auto.ts': '',
    });
    const result = await scanDir('**', {
      cwd: tmpDir,
      exclude: ['**/generated/**'],
    });
    expect(result.files).not.toContain('src/generated/auto.ts');
    expect(result.files).toContain('src/index.ts');
  });

  it('should return sorted files', async () => {
    createFiles({
      'c.ts': '',
      'a.ts': '',
      'b.ts': '',
    });
    const result = await scanDir('**', { cwd: tmpDir });
    expect(result.files).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('should return empty results for non-existent directory', async () => {
    // fast-glob returns empty array for non-existent cwd rather than throwing
    const result = await scanDir('**', { cwd: '/nonexistent/path/xyz' });
    expect(result.files).toEqual([]);
    expect(result.count).toBe(0);
  });
});

describe('scanDirSync', () => {
  it('should scan files synchronously', () => {
    createFiles({
      'src/index.ts': '',
      'package.json': '{}',
    });
    const result = scanDirSync('**', { cwd: tmpDir });
    expect(result.count).toBe(2);
    expect(result.files).toContain('src/index.ts');
  });

  it('should exclude default patterns', () => {
    createFiles({
      'src/app.ts': '',
      'node_modules/dep/index.js': '',
      '.git/config': '',
    });
    const result = scanDirSync('**', { cwd: tmpDir });
    expect(result.files).toEqual(['src/app.ts']);
  });
});
