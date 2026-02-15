# CLI Module Patterns

> Common patterns and architectural conventions in the CLI module

<!-- prospec:auto-start -->
## Pattern 1: Thin CLI Layer (Parse → Execute → Format)

### Description
All command handlers follow a strict three-step pattern with zero business logic in the CLI layer.

### Implementation
**Step 1: Parse** — Extract options and arguments from Commander
**Step 2: Execute** — Delegate to service's `execute()` function
**Step 3: Format** — Pass result to formatter with resolved log level

### Code Example
```typescript
// From commands/init.ts
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('初始化 Prospec 專案結構')
    .option('--name <name>', '指定專案名稱')
    .option('--agents <list>', 'AI agents（以逗號分隔）', parseAgents)
    .action(async (options: { name?: string; agents?: string[] }) => {
      // Parse: extract global options
      const globalOpts = program.opts<GlobalOptions>();
      const logLevel = resolveLogLevel(globalOpts);

      try {
        // Execute: delegate to service
        const result = await execute({
          name: options.name,
          agents: options.agents,
        });

        // Format: render result to stdout
        formatInitOutput(result, logLevel);
      } catch (err) {
        // Error handling: unified error dispatcher
        handleError(err, globalOpts.verbose ?? false);
      }
    });
}
```

### Why
- **Testability**: Services can be tested without CLI infrastructure
- **Reusability**: Services can be called from other contexts (API, SDK)
- **Separation of concerns**: I/O (CLI) is isolated from logic (services)

---

## Pattern 2: preAction Hook for Config Check

### Description
Non-init commands require `.prospec.yaml` to exist. This is enforced early via Commander's lifecycle hook, not in individual command handlers.

### Implementation
```typescript
// From index.ts
const INIT_COMMANDS = new Set(['init', 'help']);

program.hook('preAction', (_thisCommand, actionCommand) => {
  // Walk up command tree to find if any ancestor is in INIT_COMMANDS
  let cmd: Command | null = actionCommand;
  while (cmd) {
    if (INIT_COMMANDS.has(cmd.name())) return;
    cmd = cmd.parent;
  }

  // Skip check for root program (--version, --help)
  if (actionCommand.name() === 'prospec') return;

  // Throw error if config missing
  if (!fs.existsSync('.prospec.yaml')) {
    throw new ConfigNotFound();
  }
});
```

### Why
- **Fail fast**: Error before service execution
- **DRY**: Single check point instead of duplicating in every command
- **Clear error**: User gets immediate feedback with suggestion

---

## Pattern 3: Command Groups (Parent + Subcommands)

### Description
Related commands are organized under parent command groups using a two-step registration pattern.

### Implementation
**Step 1: Create parent command group** (from `change-story.ts`):
```typescript
export function registerChangeCommand(program: Command): void {
  const change = program
    .command('change')
    .description('變更管理');

  // Attach first subcommand
  change
    .command('story')
    .argument('<name>', '變更名稱（kebab-case）')
    .option('--description <desc>', '變更描述')
    .action(async (name, options) => { /* ... */ });
}
```

**Step 2: Find parent and attach subcommand** (from `change-plan.ts`):
```typescript
export function registerChangePlanCommand(program: Command): void {
  // Find the existing 'change' command group
  const changeCmd = program.commands.find((cmd) => cmd.name() === 'change');
  if (!changeCmd) return;

  // Attach subcommand
  changeCmd
    .command('plan')
    .option('--change <name>', '指定變更名稱')
    .action(async (options) => { /* ... */ });
}
```

### Why
- **Logical grouping**: `prospec change story|plan|tasks` reads as a workflow
- **Extensibility**: New subcommands can be added without modifying existing files
- **Discoverability**: `prospec change --help` shows all related subcommands

---

## Pattern 4: Formatter Pattern (Result + LogLevel → stdout)

### Description
All formatters follow a consistent signature and behavior for terminal output.

### Implementation
**Signature**:
```typescript
export function format*Output(
  result: *Result,
  logLevel: LogLevel = 'normal',
): void
```

**Behavior**:
1. Return early if `logLevel === 'quiet'` (CI/CD mode)
2. Build output lines in memory (`const lines: string[] = []`)
3. Conditionally include verbose sections (`if (logLevel === 'verbose')`)
4. Style with picocolors (`pc.green('✓')`, `pc.cyan(value)`, `pc.dim(text)`)
5. Write once to stdout (`process.stdout.write(lines.join('\n') + '\n')`)

### Code Example
```typescript
// From formatters/init-output.ts
export function formatInitOutput(
  result: InitResult,
  logLevel: LogLevel = 'normal',
): void {
  if (logLevel === 'quiet') return;

  const lines: string[] = [];

  // Always show created files
  for (const file of result.createdFiles) {
    lines.push(`${pc.green('✓')} Created ${file}`);
  }

  // Conditionally show tech stack
  if (hasTechStack(result.techStack)) {
    lines.push('');
    lines.push(formatTechStackLine(result.techStack));
  }

  // ... more sections ...

  // Single write to stdout
  process.stdout.write(lines.join('\n') + '\n');
}
```

### Why
- **Consistency**: All commands have the same output structure and styling
- **CI/CD friendly**: Quiet mode for machine-readable output
- **Performance**: Single write reduces TTY overhead

---

## Pattern 5: Error Hierarchy Dispatch

### Description
The error handler distinguishes between domain errors (ProspecError) and unexpected errors, providing tailored output for each.

### Implementation
```typescript
// From formatters/error-output.ts
export function handleError(error: unknown, verbose = false): void {
  if (error instanceof ProspecError) {
    formatProspecError(error);
  } else {
    formatGenericError(error, verbose);
  }
}

export function formatProspecError(error: ProspecError): void {
  process.exitCode = 1;
  const msg = `${pc.red('✗')} ${error.message}`;
  const suggestion = `  ${pc.dim('→')} ${highlightCommands(error.suggestion)}`;
  process.stderr.write(msg + '\n' + suggestion + '\n');
}

export function formatGenericError(error: unknown, verbose = false): void {
  process.exitCode = 1;
  process.stderr.write(`${pc.red('✗')} 發生未預期的錯誤\n`);

  if (error instanceof Error) {
    process.stderr.write(`\n  ${pc.yellow(error.name)}: ${pc.dim(error.message)}\n`);
    if (verbose && error.stack) {
      const stackLines = error.stack
        .split('\n')
        .slice(1)
        .map((line) => `  ${pc.dim(line.trim())}`)
        .join('\n');
      process.stderr.write(`\n${stackLines}\n`);
    }
  }
}
```

**Command highlighting**:
```typescript
function highlightCommands(text: string): string {
  return text.replace(/`([^`]+)`/g, (_, cmd: string) => pc.cyan(`\`${cmd}\``));
}
```

### Why
- **User experience**: Domain errors show actionable suggestions
- **Developer experience**: Generic errors show stack traces (verbose only)
- **Exit codes**: All errors set `process.exitCode = 1` for CI/CD

---

## Pattern 6: Global Options via `program.opts()`

### Description
Global flags (`--verbose`, `--quiet`) are resolved inside command actions, not passed as Commander arguments.

### Implementation
```typescript
// From commands/init.ts
function resolveLogLevel(opts: GlobalOptions): LogLevel {
  if (opts.quiet) return 'quiet';
  if (opts.verbose) return 'verbose';
  return 'normal';
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .action(async (options) => {
      // Access global options from root program
      const globalOpts = program.opts<GlobalOptions>();
      const logLevel = resolveLogLevel(globalOpts);

      // Use logLevel in formatter
      formatInitOutput(result, logLevel);
    });
}
```

### Why
- **Type safety**: `GlobalOptions` type ensures correct access
- **Consistent resolution**: Same logic in every command
- **No Commander type gymnastics**: Global options are read-only, not mutated

---

## Pattern 7: Commander Error Handling with exitOverride

### Description
Commander throws on `--help`/`--version` and invalid arguments when `.exitOverride()` is enabled. The main entry filters these cases.

### Implementation
```typescript
// From index.ts
async function main(): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    // Clean exit codes (--help, --version) are ignored
    if (
      err instanceof Error &&
      'exitCode' in err &&
      (err as { exitCode: number }).exitCode === 0
    ) {
      return;
    }

    // Commander parse errors (unknown option, missing arg) already outputted
    if (
      err instanceof Error &&
      'code' in err &&
      typeof (err as { code: string }).code === 'string' &&
      (err as { code: string }).code.startsWith('commander.')
    ) {
      process.exitCode = 1;
      return;
    }

    // Application errors: dispatch to handleError
    const opts = program.opts<GlobalOptions>();
    handleError(err, opts.verbose ?? false);
  }
}
```

### Why
- **Clean help output**: `--help` doesn't trigger error handler
- **Commander errors shown once**: Parse errors already have output from Commander
- **Application errors formatted**: Domain errors get custom formatting
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
