#!/usr/bin/env node

import * as fs from 'node:fs';
import { Command } from 'commander';
import pc from 'picocolors';
import { handleError } from './formatters/error-output.js';
import { ConfigNotFound } from '../types/errors.js';

// Read version from package.json at build time via Node.js import
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

/**
 * Commands that do NOT require .prospec.yaml to exist.
 */
const INIT_COMMANDS = new Set(['init', 'help']);

/**
 * Resolve verbose/quiet from global options into a log level.
 */
export type GlobalOptions = {
  verbose?: boolean;
  quiet?: boolean;
};

export function createProgram(): Command {
  const program = new Command();

  program
    .name('prospec')
    .description('Progressive Spec-Driven Development CLI')
    .version(pkg.version)
    .option('--verbose', '啟用詳細輸出')
    .option('-q, --quiet', '靜默模式（只輸出結果，適合 CI/CD）')
    .configureOutput({
      outputError: (str, write) => write(pc.red(str)),
    })
    .exitOverride();

  // preAction hook: check .prospec.yaml existence for non-init commands
  program.hook('preAction', (_thisCommand, actionCommand) => {
    const cmdName = actionCommand.name();
    // Walk up to find if any ancestor is in INIT_COMMANDS
    let cmd: Command | null = actionCommand;
    while (cmd) {
      if (INIT_COMMANDS.has(cmd.name())) return;
      cmd = cmd.parent;
    }

    // Skip check for root program (e.g. --version, --help)
    if (cmdName === 'prospec') return;

    if (!fs.existsSync('.prospec.yaml')) {
      throw new ConfigNotFound();
    }
  });

  // Register subcommand groups
  // Individual command files will be registered in their respective phases
  // Phase 3: init
  // Phase 4: steering
  // Phase 5: knowledge (with generate subcommand)
  // Phase 6: agent (with sync subcommand)
  // Phase 7-9: change (with story/plan/tasks subcommands)

  return program;
}

/**
 * Main entry point — parse argv and handle errors.
 */
async function main(): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    // Commander throws on --help/--version with exitOverride; ignore clean exits
    if (
      err instanceof Error &&
      'exitCode' in err &&
      (err as { exitCode: number }).exitCode === 0
    ) {
      return;
    }

    // Commander parse errors (unknown option, missing arg) already outputted
    if (
      err instanceof Error &&
      'code' in err &&
      typeof (err as { code: string }).code === 'string' &&
      (err as { code: string }).code.startsWith('commander.')
    ) {
      process.exitCode = 1;
      return;
    }

    const opts = program.opts<GlobalOptions>();
    handleError(err, opts.verbose ?? false);
  }
}

main();
