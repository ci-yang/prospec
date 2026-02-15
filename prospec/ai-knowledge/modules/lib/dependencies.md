# lib Module - Dependencies

> Internal and external dependencies with usage patterns

<!-- prospec:auto-start -->

## Internal Imports

### From `types` Module

**config.ts**
```typescript
import { ProspecConfigSchema } from '../types/config.js';
import type { ProspecConfig } from '../types/config.js';
import { ConfigNotFound, ConfigInvalid } from '../types/errors.js';
```

**fs-utils.ts**
```typescript
import { WriteError } from '../types/errors.js';
```

**template.ts**
```typescript
import { TemplateError } from '../types/errors.js';
```

**scanner.ts**
```typescript
import { ScanError } from '../types/errors.js';
```

**module-detector.ts**
```typescript
import type { ModuleMap } from '../types/module-map.js';
import { ModuleDetectionError } from '../types/errors.js';
```

**yaml-utils.ts**
```typescript
import { YamlParseError } from '../types/errors.js';
```

**logger.ts**
```typescript
import type { LogLevel } from '../types/config.js';
```

### Cross-lib Dependencies

**config.ts** imports from other lib utilities:
```typescript
import { atomicWrite } from './fs-utils.js';
import { parseYaml, parseYamlDocument, stringifyYamlDocument } from './yaml-utils.js';
```

## External Packages

### zod
**Used in**: `config.ts`

**Purpose**: Schema validation for `.prospec.yaml` configuration

**Usage**:
```typescript
import { z } from 'zod';

const result = ProspecConfigSchema.safeParse(data);
if (!result.success) {
  const issues = result.error.issues.map((issue: z.core.$ZodIssue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  // ...
}
```

### fast-glob
**Used in**: `scanner.ts`

**Purpose**: High-performance directory scanning with glob patterns

**Usage**:
```typescript
import fg from 'fast-glob';

const files = await fg.glob(patterns, {
  cwd,
  deep: depth,
  ignore,
  onlyFiles,
  dot: false,
  followSymbolicLinks: false,
});
```

### handlebars
**Used in**: `template.ts`

**Purpose**: Template rendering engine with helpers and partials

**Usage**:
```typescript
import Handlebars from 'handlebars';

// Register helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('join', (arr, sep) => arr.join(sep));

// Compile and render
const compiled = Handlebars.compile(source, { noEscape: true });
return compiled(context);
```

**Built-in Helpers**:
- `{{eq a b}}`: Equality check
- `{{contains array value}}`: Array membership test
- `{{join array separator}}`: Array join
- `{{isoDate}}`: Current ISO 8601 date
- `{{indent text spaces}}`: Indent each line

### picocolors
**Used in**: `logger.ts`

**Purpose**: Terminal colors with automatic TTY detection

**Usage**:
```typescript
import pc from 'picocolors';

write(`${pc.green('✓')} ${message}`);
write(`${pc.red('✗')} ${message}`);
write(`${pc.yellow('⚠')} ${message}`);
write(`${pc.cyan('ℹ')} ${message}`);
write(`${pc.dim('⎿')} ${message}`);
```

### yaml
**Used in**: `yaml-utils.ts`

**Purpose**: Comment-preserving YAML parsing and stringification

**Usage**:
```typescript
import { Document, parseDocument, stringify } from 'yaml';

// Parse with comment preservation
const doc = parseDocument(content);
if (doc.errors.length > 0) throw new YamlParseError(...);

// Modify while preserving comments
doc.contents = doc.createNode(config);
return doc.toString();
```

## Reverse Dependencies

The `lib` module is imported by:

### services Module
- `config-service.ts`: Uses `readConfig`, `writeConfig`, `resolveBasePaths`
- `knowledge-service.ts`: Uses `renderTemplate`, `mergeContent`, `scanDir`, `atomicWrite`
- `scan-service.ts`: Uses `scanDir`, `detectTechStack`
- `skill-service.ts`: Uses `detectModules`, `detectAgents`

### cli Module
- `index.ts`: Uses `createLogger`
- `commands/*.ts`: Uses various `lib` utilities for file operations and logging

### tests
- `tests/lib/*.test.ts`: Direct unit tests for all lib modules
- `tests/services/*.test.ts`: Integration tests using lib utilities

## Node.js Built-ins

All `lib` files use Node.js built-in modules:
- `node:fs`: File system operations
- `node:path`: Path resolution
- `node:os`: Operating system info (agent-detector)

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
