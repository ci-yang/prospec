import type { Command } from 'commander';
import { execute } from '../../services/knowledge-init.service.js';
import { formatKnowledgeInitOutput } from '../formatters/knowledge-init-output.js';
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
 * Register the `init` subcommand under the `knowledge` command group.
 *
 * Usage:
 *   prospec knowledge init [--dry-run] [--depth <n>]
 */
export function registerKnowledgeInitCommand(
  knowledge: Command,
  program: Command,
): void {
  knowledge
    .command('init')
    .description('掃描專案並產生 raw-scan.md 和空骨架')
    .option('--dry-run', '只預覽，不寫入檔案')
    .option('--depth <n>', '目錄掃描深度', '10')
    .action(
      async (options: { dryRun?: boolean; depth?: string }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            dryRun: options.dryRun,
            depth: options.depth ? parseInt(options.depth, 10) : undefined,
          });
          formatKnowledgeInitOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
