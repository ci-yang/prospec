import type { Command } from 'commander';
import { execute } from '../../services/steering.service.js';
import { formatSteeringOutput } from '../formatters/steering-output.js';
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
 * Register the `steering` command onto the program.
 *
 * Usage:
 *   prospec steering [--dry-run] [--depth <n>]
 *
 * --depth accepts a positive integer controlling scan depth (default: 10).
 */
export function registerSteeringCommand(program: Command): void {
  program
    .command('steering')
    .description('分析現有專案架構')
    .option('--dry-run', '只預覽，不寫入檔案')
    .option(
      '--depth <n>',
      '掃描深度',
      (value: string) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < 1) {
          throw new Error(`無效的深度值：${value}（需為正整數）`);
        }
        return parsed;
      },
      10,
    )
    .action(
      async (options: { dryRun?: boolean; depth?: number }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            dryRun: options.dryRun,
            depth: options.depth,
          });
          formatSteeringOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
