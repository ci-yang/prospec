import type { Command } from 'commander';
import { execute } from '../../services/knowledge.service.js';
import { formatKnowledgeOutput } from '../formatters/knowledge-output.js';
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
 * Register the `knowledge` command group with `generate` subcommand.
 *
 * Usage:
 *   prospec knowledge generate [--dry-run]
 *
 * The parent `knowledge` command is a command group (no action).
 * `generate` is the subcommand that executes knowledge generation.
 */
export function registerKnowledgeCommand(program: Command): void {
  const knowledge = program
    .command('knowledge')
    .description('AI Knowledge 管理');

  knowledge
    .command('generate')
    .description('生成 AI Knowledge 文件')
    .option('--dry-run', '只預覽，不寫入檔案')
    .action(
      async (options: { dryRun?: boolean }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            dryRun: options.dryRun,
          });
          formatKnowledgeOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
