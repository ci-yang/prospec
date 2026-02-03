import type { Command } from 'commander';
import { execute } from '../../services/init.service.js';
import { formatInitOutput } from '../formatters/init-output.js';
import { handleError } from '../formatters/error-output.js';
import type { GlobalOptions } from '../index.js';
import type { LogLevel } from '../../types/config.js';

/**
 * Resolve log level from global options.
 */
function resolveLogLevel(opts: GlobalOptions): LogLevel {
  if (opts.quiet) return 'quiet';
  if (opts.verbose) return 'verbose';
  return 'normal';
}

/**
 * Register the `init` command onto the program.
 *
 * Usage:
 *   prospec init [--name <name>] [--agents <list>]
 *
 * --agents accepts a comma-separated list and skips interactive selection (CI/CD mode).
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('初始化 Prospec 專案結構')
    .option('--name <name>', '指定專案名稱')
    .option(
      '--agents <list>',
      'AI agents（以逗號分隔，跳過互動選擇）',
      (value: string) => value.split(',').map((s) => s.trim()),
    )
    .action(async (options: { name?: string; agents?: string[] }) => {
      const globalOpts = program.opts<GlobalOptions>();
      const logLevel = resolveLogLevel(globalOpts);

      try {
        const result = await execute({
          name: options.name,
          agents: options.agents,
        });
        formatInitOutput(result, logLevel);
      } catch (err) {
        handleError(err, globalOpts.verbose ?? false);
      }
    });
}
