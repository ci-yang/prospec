import type { Command } from 'commander';
import { execute } from '../../services/change-plan.service.js';
import { formatChangePlanOutput } from '../formatters/change-plan-output.js';
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
 * Register the `plan` subcommand under the `change` command group.
 *
 * Usage:
 *   prospec change plan [--change <name>]
 *
 * The `change` parent command must already exist (registered by change-story.ts).
 * This function finds it and adds the `plan` subcommand.
 */
export function registerChangePlanCommand(program: Command): void {
  // Find the existing 'change' command group
  const changeCmd = program.commands.find((cmd) => cmd.name() === 'change');
  if (!changeCmd) return;

  changeCmd
    .command('plan')
    .description('生成實作計劃')
    .option('--change <name>', '指定變更名稱')
    .action(
      async (options: { change?: string }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            change: options.change,
            quiet: globalOpts.quiet,
          });
          formatChangePlanOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
