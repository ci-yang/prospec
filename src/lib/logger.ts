import pc from 'picocolors';

export type LogLevel = 'quiet' | 'normal' | 'verbose';

export interface Logger {
  success(message: string, detail?: string): void;
  error(message: string, detail?: string): void;
  warning(message: string, detail?: string): void;
  info(message: string, detail?: string): void;
  step(message: string): void;
  detail(label: string, value: string): void;
  list(items: string[]): void;
  summary(message: string): void;
}

/**
 * Creates a logger with three output modes:
 * - quiet:   only stderr errors
 * - normal:  result summaries
 * - verbose: every step detailed
 *
 * Symbols: ✓ success, ✗ error, ⚠ warning, ℹ info, ⎿ step, → detail, • list
 * Colors auto-disabled in non-TTY environments (picocolors handles this).
 */
export function createLogger(level: LogLevel = 'normal'): Logger {
  const write = (msg: string) => {
    process.stdout.write(msg + '\n');
  };

  const writeErr = (msg: string) => {
    process.stderr.write(msg + '\n');
  };

  return {
    success(message: string, detail?: string) {
      if (level === 'quiet') return;
      const extra = detail ? ` ${pc.dim(detail)}` : '';
      write(`${pc.green('✓')} ${message}${extra}`);
    },

    error(message: string, detail?: string) {
      const extra = detail ? ` ${pc.dim(detail)}` : '';
      writeErr(`${pc.red('✗')} ${message}${extra}`);
    },

    warning(message: string, detail?: string) {
      if (level === 'quiet') return;
      const extra = detail ? ` ${pc.dim(detail)}` : '';
      write(`${pc.yellow('⚠')} ${message}${extra}`);
    },

    info(message: string, detail?: string) {
      if (level === 'quiet') return;
      const extra = detail ? ` ${pc.dim(detail)}` : '';
      write(`${pc.cyan('ℹ')} ${message}${extra}`);
    },

    step(message: string) {
      if (level !== 'verbose') return;
      write(`${pc.dim('⎿')} ${message}`);
    },

    detail(label: string, value: string) {
      if (level !== 'verbose') return;
      write(`  ${pc.dim('→')} ${pc.cyan(label)}: ${value}`);
    },

    list(items: string[]) {
      if (level !== 'verbose') return;
      for (const item of items) {
        write(`    ${pc.dim('•')} ${item}`);
      }
    },

    summary(message: string) {
      if (level === 'quiet') return;
      write(`\n${message}`);
    },
  };
}
