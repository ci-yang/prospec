import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { ChangeTasksResult } from '../../services/change-tasks.service.js';

/**
 * Format the ChangeTasksResult for terminal output.
 *
 * Output structure:
 * 1. Created files list (✓ green checkmarks)
 * 2. Related modules (if any)
 * 3. Status update confirmation
 * 4. Next steps suggestion
 */
export function formatChangeTasksOutput(
  result: ChangeTasksResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Created files
  for (const file of result.createdFiles) {
    lines.push(`${pc.green('✓')} Created ${file}`);
  }

  // 2. Status update
  lines.push(`${pc.green('✓')} Updated metadata.yaml status → ${pc.cyan('tasks')}`);

  // 3. Related modules
  if (result.relatedModules.length > 0) {
    lines.push('');
    lines.push('Related modules:');
    for (const mod of result.relatedModules) {
      lines.push(`  ${pc.green('●')} ${mod}`);
    }
  }

  // 4. Next steps
  lines.push('');
  lines.push(
    `${pc.dim('→')} Edit ${pc.cyan(`\`.prospec/changes/${result.changeName}/tasks.md\``)} to refine the task breakdown`,
  );
  lines.push(
    `${pc.dim('→')} Use ${pc.cyan('`/prospec-implement`')} skill to start implementation`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
