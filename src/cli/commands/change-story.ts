import type { Command } from 'commander';
import { execute } from '../../services/change-story.service.js';
import { formatChangeStoryOutput } from '../formatters/change-story-output.js';
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
 * Register the `change` command group with `story` subcommand.
 *
 * Usage:
 *   prospec change story <name> [--description <desc>]
 *
 * The parent `change` command is a command group (no action).
 * `story` is the subcommand that creates a change story directory.
 */
export function registerChangeCommand(program: Command): void {
  const change = program
    .command('change')
    .description('變更管理');

  change
    .command('story')
    .description('建立變更需求')
    .argument('<name>', '變更名稱（kebab-case）')
    .option('--description <desc>', '變更描述')
    .action(
      async (name: string, options: { description?: string }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            name,
            description: options.description,
          });
          formatChangeStoryOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
