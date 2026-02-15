# lib Module - Patterns

> Core patterns and design principles used in the lib module

<!-- prospec:auto-start -->

## Pattern 1: Atomic Writes

**Problem**: File writes can be interrupted, leaving corrupt or partial files.

**Solution**: Write to a temporary file, then atomically rename to target path.

**Implementation** (`fs-utils.ts`):
```typescript
export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    await fs.promises.writeFile(tmpPath, content, 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new WriteError(
      filePath,
      err instanceof Error ? err.message : String(err),
    );
  }
}
```

**Usage**:
- All file writes in Prospec use `atomicWrite`
- Config updates, knowledge generation, skill creation

**Benefits**:
- Prevents partial writes
- Safe concurrent execution
- Automatic cleanup on failure

## Pattern 2: Content Merging with Markers

**Problem**: AI-generated files need regeneration without overwriting user edits.

**Solution**: Use HTML comment markers to separate auto-generated and user-written sections.

**Implementation** (`content-merger.ts`):
```typescript
const AUTO_START = '<!-- prospec:auto-start -->';
const AUTO_END = '<!-- prospec:auto-end -->';
const USER_START = '<!-- prospec:user-start -->';
const USER_END = '<!-- prospec:user-end -->';

export function mergeContent(
  newContent: string,
  existingContent: string,
): string {
  if (!existingContent.trim()) {
    return newContent;
  }

  const existingUserSections = extractUserSections(existingContent);

  if (existingUserSections.length === 0) {
    return newContent;
  }

  const newSections = parseSections(newContent);

  // Replace user sections in new content with existing user sections
  let userIndex = 0;
  const mergedSections = newSections.map((section) => {
    if (section.type === 'user' && userIndex < existingUserSections.length) {
      const preserved = existingUserSections[userIndex]!;
      userIndex++;
      return { ...section, content: preserved };
    }
    return section;
  });

  return mergedSections.map((s) => s.content).join('\n');
}
```

**Section Types**:
- `auto`: Between `auto-start` and `auto-end` (overwritten on regeneration)
- `user`: Between `user-start` and `user-end` (preserved on regeneration)
- `static`: Everything else (uses new content version)

**Usage Pattern**:
```markdown
# Title

> Description

<!-- prospec:auto-start -->
This content is auto-generated.
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
User notes go here.
<!-- prospec:user-end -->
```

## Pattern 3: Singleton Handlebars Instance

**Problem**: Handlebars helpers and partials must be registered before template rendering.

**Solution**: Initialize helpers once on first use, reuse singleton instance.

**Implementation** (`template.ts`):
```typescript
let initialized = false;

function registerHelpers(): void {
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('contains', (arr, value) =>
    Array.isArray(arr) && arr.includes(value));
  Handlebars.registerHelper('join', (arr, sep) =>
    Array.isArray(arr) ? arr.join(sep) : '');
  Handlebars.registerHelper('isoDate', () => new Date().toISOString());
  Handlebars.registerHelper('indent', (text, spaces) => {
    const pad = ' '.repeat(spaces ?? 2);
    return text.split('\n').map(line => pad + line).join('\n');
  });
}

function ensureInitialized(): void {
  if (initialized) return;
  registerHelpers();
  initialized = true;
}

export function renderTemplate(
  templatePath: string,
  context: Record<string, unknown>,
): string {
  ensureInitialized();
  // ... render logic
}
```

**Benefits**:
- No duplicate helper registration
- Consistent template environment
- Lazy initialization

## Pattern 4: Security-First Scanning

**Problem**: Directory scans can expose sensitive files or run indefinitely in deep trees.

**Solution**: Default exclusion patterns, depth limits, and sensitive file filtering.

**Implementation** (`scanner.ts`):
```typescript
const DEFAULT_IGNORE = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  '__pycache__/**',
  '.venv/**',
  'venv/**',
];

const SENSITIVE_PATTERNS = [
  '**/*.env*',
  '**/*credential*',
  '**/*secret*',
  '**/*.key',
  '**/*.pem',
];

export async function scanDir(
  patterns: string | string[] = '**',
  options: ScanOptions = {},
): Promise<ScanResult> {
  const { depth = 10, exclude = [], onlyFiles = true, cwd = process.cwd() } = options;

  const ignore = [
    ...DEFAULT_IGNORE,
    ...SENSITIVE_PATTERNS,
    ...exclude,
  ];

  const files = await fg.glob(patterns, {
    cwd,
    deep: depth,
    ignore,
    onlyFiles,
    dot: false,
    followSymbolicLinks: false,
  });

  return { files: files.sort(), count: files.length };
}
```

**Safety Features**:
- Depth limit (default: 10)
- Ignores build artifacts
- Excludes sensitive patterns per REQ-STEER-008
- No symlink following
- No dotfiles

## Pattern 5: Five-Step Module Detection

**Problem**: Automatically identify modules in diverse project structures.

**Solution**: Multi-strategy detection with priority fallback.

**Implementation** (`module-detector.ts`):
```typescript
export function detectModules(files: string[], cwd: string): DetectionResult {
  // Step 1: module-map.yaml priority
  const existing = loadExistingModuleMap(cwd);
  if (existing) return existing;

  // Step 2: Directory name matching
  const dirModules = detectFromDirectories(files);

  // Step 3: Architecture pattern recognition (MVC, Clean, etc)
  const architecture = detectArchitecturePattern(files);

  // Step 4: Keyword generation
  const modulesWithKeywords = dirModules.map((m) => ({
    ...m,
    keywords: generateKeywords(m.name, m.paths),
  }));

  // Step 5: Conflict resolution (merge overlapping modules)
  const resolvedModules = resolveConflicts(modulesWithKeywords);

  // Detect relationships via import scanning
  const modulesWithRelationships = detectRelationships(resolvedModules, files, cwd);

  return {
    modules: modulesWithRelationships,
    architecture,
    entryPoints: detectEntryPoints(files),
  };
}
```

**Recognized Architectures**:
```typescript
const ARCHITECTURE_PATTERNS = {
  mvc: ['models', 'views', 'controllers'],
  layered: ['routes', 'services', 'models'],
  clean: ['domain', 'application', 'infrastructure'],
  feature: ['features', 'modules'],
  pragmatic: ['cli', 'services', 'lib', 'types'],
};
```

**Benefits**:
- Respects manual configuration
- Adapts to different architectures
- Generates keywords for AI retrieval
- Detects dependencies via import analysis

## Pattern 6: Comment-Preserving YAML

**Problem**: Round-trip YAML edits lose comments and formatting.

**Solution**: Use YAML Document API to modify values while preserving structure.

**Implementation** (`yaml-utils.ts`):
```typescript
export function parseYamlDocument(
  content: string,
  sourcePath?: string,
): Document {
  const doc = parseDocument(content);
  if (doc.errors.length > 0) {
    throw new YamlParseError(sourcePath, doc.errors[0]?.message);
  }
  return doc;
}

export function stringifyYamlDocument(doc: Document): string {
  return doc.toString();
}
```

**Usage in Config Updates** (`config.ts`):
```typescript
export async function writeConfig(config: ProspecConfig, cwd?: string): Promise<void> {
  const configPath = resolveConfigPath(cwd);
  let output: string;

  try {
    const existing = await fs.promises.readFile(configPath, 'utf-8');
    const doc = parseYamlDocument(existing, configPath);
    // Modify values, preserve comments
    doc.contents = doc.createNode(config) as typeof doc.contents;
    output = stringifyYamlDocument(doc);
  } catch {
    // File doesn't exist — write fresh
    const { stringify } = await import('yaml');
    output = stringify(config);
  }

  await atomicWrite(configPath, output);
}
```

**Benefits**:
- User comments preserved
- Formatting maintained
- Safe metadata updates

## Pattern 7: Structured Logger with Levels

**Problem**: CLI output must adapt to user preferences (quiet, normal, verbose).

**Solution**: Three-level logger with semantic methods and Unicode symbols.

**Implementation** (`logger.ts`):
```typescript
export function createLogger(level: LogLevel = 'normal'): Logger {
  const write = (msg: string) => process.stdout.write(msg + '\n');
  const writeErr = (msg: string) => process.stderr.write(msg + '\n');

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
  };
}
```

**Levels**:
- `quiet`: Only errors (stderr)
- `normal`: Summaries and results
- `verbose`: Every step detailed

**Symbols**:
- ✓ success (green)
- ✗ error (red)
- ⚠ warning (yellow)
- ℹ info (cyan)
- ⎿ step (dim)
- → detail (dim)
- • list item (dim)

**Benefits**:
- Semantic methods
- Consistent formatting
- TTY-aware colors (picocolors)
- Errors always visible

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
