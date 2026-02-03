import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { SteeringResult } from '../../services/steering.service.js';

/**
 * Format the SteeringResult for terminal output with proper styling.
 *
 * Output structure:
 * 1. Scan summary (file count, module count, architecture pattern)
 * 2. Entry points list (verbose mode only)
 * 3. Modules list with file counts
 * 4. Module details: keywords and relationships (verbose mode only)
 * 5. Output files list (✓ green checkmarks)
 * 6. Dry-run notice (⚠ yellow warning if applicable)
 * 7. Next steps suggestion (dim → with cyan command)
 *
 * @param result - The steering result from steering service
 * @param logLevel - Controls output verbosity (quiet shows nothing, normal shows summary, verbose shows details)
 */
export function formatSteeringOutput(
  result: SteeringResult,
  logLevel: LogLevel = 'normal',
): void {
  // In quiet mode, output nothing
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Scan summary section
  lines.push(
    `Scanned ${pc.yellow(result.fileCount.toString())} files, detected ${pc.yellow(result.moduleCount.toString())} modules`,
  );
  lines.push(`Architecture: ${pc.cyan(result.architecture)}`);

  // 2. Entry points section (verbose only)
  if (logLevel === 'verbose' && result.entryPoints.length > 0) {
    lines.push('');
    lines.push('Entry points:');
    for (const entry of result.entryPoints) {
      lines.push(`  ${pc.dim('•')} ${entry}`);
    }
  }

  // 3. Modules list section
  if (result.modules.length > 0) {
    lines.push('');
    lines.push('Modules:');
    for (const module of result.modules) {
      // Normal mode: module name + file count
      const fileCountStr = pc.yellow(`(${module.fileCount} files)`);
      lines.push(`  ${pc.cyan(module.name)} ${fileCountStr}`);
      lines.push(`    ${pc.dim(module.description)}`);

      // 4. Module details (verbose only)
      if (logLevel === 'verbose') {
        // Keywords
        if (module.keywords.length > 0) {
          lines.push(`    Keywords: ${pc.dim(module.keywords.join(', '))}`);
        }

        // Dependencies (depends_on)
        if (module.relationships.depends_on.length > 0) {
          const deps = module.relationships.depends_on
            .map((d) => pc.cyan(d))
            .join(', ');
          lines.push(`    Depends on: ${deps}`);
        }

        // Dependents (used_by)
        if (module.relationships.used_by.length > 0) {
          const usedBy = module.relationships.used_by
            .map((u) => pc.cyan(u))
            .join(', ');
          lines.push(`    Used by: ${usedBy}`);
        }
      }
    }
  }

  // 5. Output files section (only if not dry-run)
  if (!result.dryRun && result.outputFiles.length > 0) {
    lines.push('');
    for (const file of result.outputFiles) {
      lines.push(`${pc.green('✓')} Updated ${file}`);
    }
  }

  // 6. Dry-run notice
  if (result.dryRun) {
    lines.push('');
    lines.push(
      `${pc.yellow('⚠')} Dry-run mode: no files were modified`,
    );
  }

  // 7. Next steps suggestion
  lines.push('');
  lines.push(
    `${pc.dim('→')} Module map and architecture docs are ready for AI assistants`,
  );

  // Output all lines
  process.stdout.write(lines.join('\n') + '\n');
}
