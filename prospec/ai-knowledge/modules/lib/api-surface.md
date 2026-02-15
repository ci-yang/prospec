# lib Module - API Surface

> Complete public API with exact TypeScript signatures

<!-- prospec:auto-start -->

## config.ts

### Interfaces

```typescript
export interface BasePaths {
  baseDir: string;
  knowledgePath: string;
  constitutionPath: string;
  specsPath: string;
}
```

### Functions

```typescript
export function resolveBasePaths(config: ProspecConfig, cwd: string): BasePaths
```

```typescript
export function resolveConfigPath(cwd?: string): string
```

```typescript
export async function readConfig(cwd?: string): Promise<ProspecConfig>
```

```typescript
export function validateConfig(
  rawYaml: string,
  sourcePath?: string,
): ProspecConfig
```

```typescript
export async function writeConfig(
  config: ProspecConfig,
  cwd?: string,
): Promise<void>
```

## content-merger.ts

### Functions

```typescript
export function parseSections(content: string): ContentSection[]
```

```typescript
export function extractUserSections(content: string): string[]
```

```typescript
export function mergeContent(
  newContent: string,
  existingContent: string,
): string
```

### Internal Interfaces (used in return types)

```typescript
interface ContentSection {
  type: 'auto' | 'user' | 'static';
  content: string;
}
```

## fs-utils.ts

### Functions

```typescript
export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<void>
```

```typescript
export async function ensureDir(dirPath: string): Promise<void>
```

```typescript
export function fileExists(filePath: string): boolean
```

## template.ts

### Functions

```typescript
export function renderTemplate(
  templatePath: string,
  context: Record<string, unknown>,
): string
```

```typescript
export function registerPartial(name: string, content: string): void
```

```typescript
export function registerPartialFromFile(
  name: string,
  templatePath: string,
): void
```

```typescript
export function registerHelper(
  name: string,
  fn: Handlebars.HelperDelegate,
): void
```

## scanner.ts

### Interfaces

```typescript
export interface ScanOptions {
  /** Maximum directory depth (default: 10) */
  depth?: number;
  /** Additional negative patterns to exclude */
  exclude?: string[];
  /** Only return files (default: true) */
  onlyFiles?: boolean;
  /** Working directory (default: process.cwd()) */
  cwd?: string;
}
```

```typescript
export interface ScanResult {
  /** All matched file paths (relative to cwd) */
  files: string[];
  /** Total file count */
  count: number;
}
```

### Functions

```typescript
export async function scanDir(
  patterns: string | string[] = '**',
  options: ScanOptions = {},
): Promise<ScanResult>
```

```typescript
export function scanDirSync(
  patterns: string | string[] = '**',
  options: ScanOptions = {},
): ScanResult
```

## detector.ts

### Interfaces

```typescript
export interface TechStackResult {
  language?: string;
  framework?: string;
  package_manager?: string;
}
```

### Functions

```typescript
export function detectTechStack(cwd?: string): TechStackResult
```

## module-detector.ts

### Interfaces

```typescript
export interface DetectedModule {
  name: string;
  description: string;
  paths: string[];
  keywords: string[];
  relationships: {
    depends_on: string[];
    used_by: string[];
  };
}
```

```typescript
export interface DetectionResult {
  modules: DetectedModule[];
  architecture: string;
  entryPoints: string[];
}
```

### Functions

```typescript
export function detectModules(
  files: string[],
  cwd: string = process.cwd(),
): DetectionResult
```

## agent-detector.ts

### Interfaces

```typescript
export interface AgentInfo {
  name: string;
  id: string;
  detected: boolean;
}
```

### Functions

```typescript
export function detectAgents(): AgentInfo[]
```

## yaml-utils.ts

### Type Re-exports

```typescript
import type { DocumentOptions, ParseOptions, SchemaOptions, ToStringOptions } from 'yaml';
```

### Functions

```typescript
export function parseYaml<T = unknown>(
  content: string,
  sourcePath?: string,
): T
```

```typescript
export function stringifyYaml(
  value: unknown,
  options?: DocumentOptions & SchemaOptions & ParseOptions & ToStringOptions,
): string
```

```typescript
export function parseYamlDocument(
  content: string,
  sourcePath?: string,
): Document
```

```typescript
export function stringifyYamlDocument(doc: Document): string
```

## logger.ts

### Type Re-exports

```typescript
export type { LogLevel }
```

### Interfaces

```typescript
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
```

### Functions

```typescript
export function createLogger(level: LogLevel = 'normal'): Logger
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
