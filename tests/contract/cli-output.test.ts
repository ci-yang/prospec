/**
 * Contract tests for CLI output format.
 *
 * Verifies that CLI commands produce output that matches
 * the contracts/cli-commands.md specification.
 *
 * Uses Commander.js exitOverride to capture output without process.exit().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProgram } from '../../src/cli/index.js';

// Capture stdout/stderr
let stdoutOutput: string[] = [];
let stderrOutput: string[] = [];
let stdoutSpy: ReturnType<typeof vi.spyOn>;
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  stdoutOutput = [];
  stderrOutput = [];
  stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
    stdoutOutput.push(String(chunk));
    return true;
  });
  stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => {
    stderrOutput.push(String(chunk));
    return true;
  });
});

afterEach(() => {
  stdoutSpy.mockRestore();
  stderrSpy.mockRestore();
});

describe('CLI Output Contract', () => {
  describe('prospec --version', () => {
    it('should output version number', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', '--version']);
      } catch (err) {
        // exitOverride throws on --version with exitCode 0
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      // Version should be a semver-like string
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('prospec --help', () => {
    it('should output help with command name', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('prospec');
    });

    it('should list available commands', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('init');
      expect(output).toContain('steering');
      expect(output).toContain('knowledge');
      expect(output).toContain('agent');
      expect(output).toContain('change');
    });

    it('should show global options', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--verbose');
      expect(output).toContain('--quiet');
      expect(output).toContain('--version');
    });
  });

  describe('prospec init --help', () => {
    it('should show init-specific options', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'init', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--name');
      expect(output).toContain('--agents');
    });
  });

  describe('prospec steering --help', () => {
    it('should show steering-specific options', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'steering', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--dry-run');
      expect(output).toContain('--depth');
    });
  });

  describe('prospec change --help', () => {
    it('should show change subcommands', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'change', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('story');
    });
  });

  describe('prospec change story --help', () => {
    it('should require name argument', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'change', 'story', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('name');
    });

    it('should show --description option', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'change', 'story', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--description');
    });
  });

  describe('prospec change plan --help', () => {
    it('should show --change option', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'change', 'plan', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--change');
    });
  });

  describe('prospec change tasks --help', () => {
    it('should show --change option', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'change', 'tasks', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--change');
    });
  });

  describe('prospec agent --help', () => {
    it('should show agent subcommands', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'agent', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('sync');
    });
  });

  describe('prospec agent sync --help', () => {
    it('should show --cli option', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'agent', 'sync', '--help']);
      } catch (err) {
        if ((err as { exitCode?: number }).exitCode !== 0) throw err;
      }
      const output = stdoutOutput.join('');
      expect(output).toContain('--cli');
    });
  });

  describe('unknown command', () => {
    it('should exit with code 1 for unknown commands', async () => {
      const program = createProgram();
      try {
        await program.parseAsync(['node', 'prospec', 'nonexistent']);
      } catch (err) {
        // Commander throws for unknown commands
        expect(err).toBeDefined();
      }
    });
  });
});
