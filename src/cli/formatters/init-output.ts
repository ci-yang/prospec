import pc from 'picocolors';
import type { LogLevel } from '../../types/config.js';
import type { InitResult, TechStackResult } from '../../services/init.service.js';

/**
 * Format the InitResult for terminal output with proper styling.
 *
 * Output structure:
 * 1. Created files list (✓ green checkmarks)
 * 2. Detected tech stack (cyan values)
 * 3. AI Assistants status (✓ detected, ○ not installed)
 * 4. Selected agents summary
 * 5. Next steps suggestion (dim → with cyan command)
 *
 * @param result - The initialization result from init service
 * @param logLevel - Controls output verbosity (quiet shows nothing, normal/verbose show same output)
 */
export function formatInitOutput(
  result: InitResult,
  logLevel: LogLevel = 'normal',
): void {
  // In quiet mode, output nothing
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // 1. Created files section
  for (const file of result.createdFiles) {
    lines.push(`${pc.green('✓')} Created ${file}`);
  }

  // 2. Tech stack section (only if detected)
  if (hasTechStack(result.techStack)) {
    lines.push(''); // Empty line separator
    lines.push(formatTechStackLine(result.techStack));
  }

  // 3. AI Assistants section
  lines.push(''); // Empty line separator
  lines.push('AI Assistants:');
  for (const agent of result.agentInfos) {
    lines.push(formatAgentLine(agent));
  }

  // 4. Selected agents summary (only if agents were selected)
  if (result.selectedAgents.length > 0) {
    lines.push(''); // Empty line separator
    lines.push(`Selected agents: ${result.selectedAgents.join(', ')}`);
  }

  // 5. Next steps suggestion
  lines.push(''); // Empty line separator
  lines.push(
    `${pc.dim('→')} Run ${pc.cyan('`prospec agent sync`')} to generate AI configurations`,
  );

  // Output all lines
  process.stdout.write(lines.join('\n') + '\n');
}

/**
 * Format a single tech stack line with cyan highlighting.
 * Example: "Tech stack detected: TypeScript / Node.js"
 */
function formatTechStackLine(techStack: TechStackResult): string {
  const parts: string[] = [];

  if (techStack.language) {
    parts.push(capitalizeFirst(techStack.language));
  }
  if (techStack.framework) {
    parts.push(capitalizeFirst(techStack.framework));
  }
  if (techStack.package_manager) {
    // Only add package manager if no framework (avoid clutter)
    if (!techStack.framework) {
      parts.push(capitalizeFirst(techStack.package_manager));
    }
  }

  const stackValue = parts.join(' / ');
  return `Tech stack detected: ${pc.cyan(stackValue)}`;
}

/**
 * Format a single agent line with status indicator.
 * Example: "  ✓ Claude Code (detected)"
 * Example: "  ○ GitHub Copilot CLI (not installed)"
 */
function formatAgentLine(agent: {
  name: string;
  id: string;
  detected: boolean;
}): string {
  if (agent.detected) {
    return `  ${pc.green('✓')} ${agent.name} (detected)`;
  } else {
    return `  ${pc.dim('○')} ${agent.name} (not installed)`;
  }
}

/**
 * Check if tech stack has any detected values.
 */
function hasTechStack(ts: TechStackResult): boolean {
  return !!(ts.language || ts.framework || ts.package_manager);
}

/**
 * Capitalize the first letter of a string.
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
