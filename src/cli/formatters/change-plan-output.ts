import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { ChangePlanResult } from '../../services/change-plan.service.js';

/**
 * Format the ChangePlanResult for terminal output.
 *
 * Output structure:
 * 1. Created files list (✓ green checkmarks)
 * 2. Related modules (if any)
 * 3. Status update confirmation
 * 4. Next steps suggestion
 */
export function formatChangePlanOutput(
  result: ChangePlanResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Created files
  for (const file of result.createdFiles) {
    lines.push(`${pc.green('✓')} Created ${file}`);
  }

  // 2. Status update
  lines.push(`${pc.green('✓')} Updated metadata.yaml status → ${pc.cyan('plan')}`);

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
    `${pc.dim('→')} Edit ${pc.cyan(`\`.prospec/changes/${result.changeName}/plan.md\``)} to fill in the implementation plan`,
  );
  lines.push(
    `${pc.dim('→')} Edit ${pc.cyan(`\`.prospec/changes/${result.changeName}/delta-spec.md\``)} to define requirement changes`,
  );
  lines.push(
    `${pc.dim('→')} Then run ${pc.cyan('`prospec change tasks`')} to generate the task list`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
