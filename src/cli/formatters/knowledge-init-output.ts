import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { KnowledgeInitResult } from '../../services/knowledge-init.service.js';

/**
 * Format the KnowledgeInitResult for terminal output.
 */
export function formatKnowledgeInitOutput(
  result: KnowledgeInitResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Scan summary
  lines.push(
    `Scanned ${pc.yellow(result.totalFiles.toString())} files (depth: ${result.scanDepth})`,
  );

  // 2. Entry points
  if (result.entryPoints.length > 0) {
    lines.push('');
    lines.push('Entry points:');
    for (const ep of result.entryPoints) {
      lines.push(`  ${pc.cyan(ep)}`);
    }
  }

  // 3. Dependencies count
  if (result.dependencies.length > 0 && logLevel === 'verbose') {
    lines.push('');
    lines.push(`Dependencies: ${pc.yellow(result.dependencies.length.toString())}`);
    for (const dep of result.dependencies.slice(0, 20)) {
      const ver = dep.version ? pc.dim(` @ ${dep.version}`) : '';
      lines.push(`  ${dep.name}${ver}`);
    }
    if (result.dependencies.length > 20) {
      lines.push(`  ${pc.dim(`... and ${result.dependencies.length - 20} more`)}`);
    }
  } else if (result.dependencies.length > 0) {
    lines.push('');
    lines.push(`Dependencies: ${pc.yellow(result.dependencies.length.toString())}`);
  }

  // 4. Output files
  if (!result.dryRun && result.outputFiles.length > 0) {
    lines.push('');
    for (const file of result.outputFiles) {
      lines.push(`${pc.green('✓')} Created ${file}`);
    }
  }

  // 5. Dry-run notice
  if (result.dryRun) {
    lines.push('');
    lines.push(
      `${pc.yellow('⚠')} Dry-run mode: no files were modified`,
    );
  }

  // 6. Next steps
  lines.push('');
  lines.push(
    `${pc.dim('→')} Run ${pc.cyan('`/prospec-knowledge-generate`')} to analyze and generate module knowledge`,
  );

  process.stdout.write(lines.join('\n') + '\n');
}
