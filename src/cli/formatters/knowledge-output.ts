import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { KnowledgeResult } from '../../services/knowledge.service.js';

/**
 * Format the KnowledgeResult for terminal output.
 *
 * Output structure:
 * 1. Module summary (count)
 * 2. Module list with file counts and keywords (verbose)
 * 3. Generated files list (✓ Created / ✓ Updated)
 * 4. Dry-run notice (⚠ if applicable)
 * 5. Next steps suggestion
 */
export function formatKnowledgeOutput(
  result: KnowledgeResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Module summary
  lines.push(
    `Generated knowledge for ${pc.yellow(result.moduleCount.toString())} modules`,
  );

  // 2. Module list
  if (result.modules.length > 0) {
    lines.push('');
    lines.push('Modules:');
    for (const mod of result.modules) {
      const fileCountStr = pc.yellow(`(${mod.fileCount} files)`);
      lines.push(`  ${pc.cyan(mod.name)} ${fileCountStr}`);

      if (logLevel === 'verbose') {
        lines.push(`    ${pc.dim(mod.description)}`);
        if (mod.keywords.length > 0) {
          lines.push(`    Keywords: ${pc.dim(mod.keywords.join(', '))}`);
        }
      }
    }
  }

  // 3. Generated files
  if (!result.dryRun && result.generatedFiles.length > 0) {
    lines.push('');
    for (const file of result.generatedFiles) {
      const verb = file.action === 'created' ? 'Created' : 'Updated';
      lines.push(`${pc.green('✓')} ${verb} ${file.path}`);
    }
  }

  // 4. Dry-run notice
  if (result.dryRun) {
    lines.push('');
    lines.push(
      `${pc.yellow('⚠')} Dry-run mode: no files were modified`,
    );
  }

  // 5. Next steps
  lines.push('');
  lines.push(
    `${pc.dim('→')} Run ${pc.cyan('`prospec agent sync`')} to update AI agent configurations`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
