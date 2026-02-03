import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { AgentSyncFullResult } from '../../services/agent-sync.service.js';

/**
 * Format the AgentSyncFullResult for terminal output with tree-style layout.
 *
 * Output structure:
 * 1. Summary (agent count, total files)
 * 2. Per-agent tree (config file + skills + references)
 * 3. Next steps suggestion
 *
 * @param result - The agent sync result from agent-sync service
 * @param logLevel - Controls output verbosity
 */
export function formatAgentSyncOutput(
  result: AgentSyncFullResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Summary
  const agentCount = result.agents.length;
  lines.push(
    `Synced ${pc.yellow(agentCount.toString())} agent${agentCount !== 1 ? 's' : ''}, generated ${pc.yellow(result.totalFiles.toString())} files`,
  );

  // 2. Per-agent tree
  for (const [i, agent] of result.agents.entries()) {
    const isLast = i === result.agents.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    lines.push('');
    lines.push(`${prefix}${pc.cyan(agent.agent)}`);

    // Config file
    lines.push(
      `${childPrefix}${pc.green('✓')} ${agent.configFile}`,
    );

    // Skill files
    if (logLevel === 'verbose') {
      // Verbose: show all individual files
      for (const skillFile of agent.skillFiles) {
        lines.push(
          `${childPrefix}${pc.green('✓')} ${skillFile}`,
        );
      }
      for (const refFile of agent.referenceFiles) {
        lines.push(
          `${childPrefix}${pc.green('✓')} ${pc.dim(refFile)}`,
        );
      }
    } else {
      // Normal: show skill count summary
      const skillCount = agent.skillFiles.length;
      const refCount = agent.referenceFiles.length;
      lines.push(
        `${childPrefix}${pc.green('✓')} ${pc.yellow(skillCount.toString())} skills`,
      );
      if (refCount > 0) {
        lines.push(
          `${childPrefix}${pc.green('✓')} ${pc.yellow(refCount.toString())} references`,
        );
      }
    }
  }

  // 3. Next steps
  lines.push('');
  lines.push(
    `${pc.dim('→')} AI agent configurations are ready. Use ${pc.cyan('`/prospec-explore`')} to start exploring.`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
