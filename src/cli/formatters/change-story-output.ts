import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { ChangeStoryResult } from '../../services/change-story.service.js';

/**
 * Format the ChangeStoryResult for terminal output with proper styling.
 *
 * Output structure:
 * 1. Created files list (✓ green checkmarks)
 * 2. Related modules (if matched)
 * 3. Next steps suggestion
 */
export function formatChangeStoryOutput(
  result: ChangeStoryResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Created files
  for (const file of result.createdFiles) {
    lines.push(`${pc.green('✓')} Created ${file}`);
  }

  // 2. Description (if provided)
  if (result.description) {
    lines.push('');
    lines.push(`Description: ${pc.cyan(result.description)}`);
  }

  // 3. Related modules (if matched)
  if (result.relatedModules.length > 0) {
    lines.push('');
    lines.push('Related modules:');
    for (const mod of result.relatedModules) {
      lines.push(`  ${pc.green('●')} ${mod.name} — ${pc.dim(mod.description)}`);
    }
  }

  // 4. Next steps
  lines.push('');
  lines.push(
    `${pc.dim('→')} Edit ${pc.cyan(`\`.prospec/changes/${result.changeName}/proposal.md\``)} to fill in your User Story`,
  );
  lines.push(
    `${pc.dim('→')} Then run ${pc.cyan('`prospec change plan`')} to generate the implementation plan`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
