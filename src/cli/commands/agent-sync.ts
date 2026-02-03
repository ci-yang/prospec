import type { Command } from 'commander';
import { execute } from '../../services/agent-sync.service.js';
import { formatAgentSyncOutput } from '../formatters/agent-sync-output.js';
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
 * Register the `agent` command group with `sync` subcommand.
 *
 * Usage:
 *   prospec agent sync [--cli <name>]
 *
 * The parent `agent` command is a command group (no action).
 * `sync` is the subcommand that executes agent configuration sync.
 */
export function registerAgentCommand(program: Command): void {
  const agent = program
    .command('agent')
    .description('AI Agent 配置管理');

  agent
    .command('sync')
    .description('同步 AI Agent 配置和 Skills')
    .option('--cli <name>', '指定特定 CLI（claude/gemini/copilot/codex）')
    .action(
      async (options: { cli?: string }) => {
        const globalOpts = program.opts<GlobalOptions>();
        const logLevel = resolveLogLevel(globalOpts);

        try {
          const result = await execute({
            cli: options.cli,
          });
          formatAgentSyncOutput(result, logLevel);
        } catch (err) {
          handleError(err, globalOpts.verbose ?? false);
        }
      },
    );
}
