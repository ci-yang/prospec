# Dependencies

> Internal and external imports for the services module.

<!-- prospec:auto-start -->

## Internal Dependencies

### From lib

```typescript
// config.ts
import { readConfig, writeConfig, resolveBasePaths } from '../lib/config.js'
import { DEFAULT_BASE_DIR } from '../types/config.js'

// fs-utils.ts
import { fileExists, ensureDir, atomicWrite } from '../lib/fs-utils.js'

// template.ts
import { renderTemplate } from '../lib/template.js'

// scanner.ts
import { scanDir } from '../lib/scanner.js'

// detector.ts
import { detectTechStack } from '../lib/detector.js'
import type { TechStackResult } from '../lib/detector.js'

// module-detector.ts
import { detectModules } from '../lib/module-detector.js'
import type { DetectionResult } from '../lib/module-detector.js'

// agent-detector.ts
import { detectAgents } from '../lib/agent-detector.js'
import type { AgentInfo } from '../lib/agent-detector.js'

// content-merger.ts
import { mergeContent } from '../lib/content-merger.js'

// yaml-utils.ts
import { parseYaml, stringifyYaml } from '../lib/yaml-utils.js'
```

### From types

```typescript
// types/config.ts
import type { ProspecConfig } from '../types/config.js'

// types/errors.ts
import {
  AlreadyExistsError,
  PrerequisiteError,
  ScanError,
  WriteError,
} from '../types/errors.js'

// types/module-map.ts
import type { ModuleMap } from '../types/module-map.js'

// types/change.ts
import type { ChangeMetadata, ChangeStatus } from '../types/change.js'

// types/skill.ts
import {
  SKILL_DEFINITIONS,
  AGENT_CONFIGS,
  type AgentConfig,
  type AgentSyncResult,
} from '../types/skill.js'
```

## External Dependencies

```typescript
// @inquirer/prompts (used by init, change-plan, change-tasks, steering)
import { checkbox, input, Separator } from '@inquirer/prompts'
import { select } from '@inquirer/prompts'
```

## Node.js Built-ins

```typescript
import * as path from 'node:path'
import * as fs from 'node:fs'
```

## Reverse Dependencies

The services module is consumed by:

- **cli/commands/** — All command handlers import and call service `execute()` functions
  - `init.command.ts` → `init.service.execute()`
  - `steering.command.ts` → `steering.service.execute()`
  - `knowledge.command.ts` → `knowledge.service.execute()`
  - `knowledge-init.command.ts` → `knowledge-init.service.execute()`
  - `knowledge-update.command.ts` → `knowledge-update.service.execute()`
  - `change-story.command.ts` → `change-story.service.execute()`
  - `change-plan.command.ts` → `change-plan.service.execute()`
  - `change-tasks.command.ts` → `change-tasks.service.execute()`
  - `agent-sync.command.ts` → `agent-sync.service.execute()`
  - `archive.command.ts` → `archive.service.execute()`

## Cross-Service Dependencies

- **archive.service.ts** imports and calls `knowledge-update.service.execute()` for automatic knowledge update after archiving changes (non-fatal).

## Dependency Graph

```
init.service.ts
  ├── lib/config (readConfig, writeConfig)
  ├── lib/fs-utils (fileExists, ensureDir, atomicWrite)
  ├── lib/template (renderTemplate)
  ├── lib/detector (detectTechStack)
  ├── lib/agent-detector (detectAgents)
  ├── types/config (ProspecConfig, DEFAULT_BASE_DIR)
  ├── types/errors (AlreadyExistsError)
  └── @inquirer/prompts (checkbox, input, Separator)

steering.service.ts
  ├── lib/config (readConfig, writeConfig, resolveBasePaths)
  ├── lib/scanner (scanDir)
  ├── lib/module-detector (detectModules, DetectionResult)
  ├── lib/detector (detectTechStack)
  ├── lib/template (renderTemplate)
  ├── lib/fs-utils (atomicWrite, ensureDir)
  ├── lib/yaml-utils (stringifyYaml)
  ├── types/config (ProspecConfig)
  └── types/module-map (ModuleMap)

knowledge.service.ts
  ├── lib/config (readConfig, resolveBasePaths)
  ├── lib/scanner (scanDir)
  ├── lib/template (renderTemplate)
  ├── lib/content-merger (mergeContent)
  ├── lib/fs-utils (atomicWrite, ensureDir)
  ├── lib/yaml-utils (parseYaml)
  ├── types/errors (PrerequisiteError)
  └── types/module-map (ModuleMap)

knowledge-init.service.ts
  ├── lib/config (readConfig, resolveBasePaths)
  ├── lib/scanner (scanDir)
  ├── lib/detector (detectTechStack)
  ├── lib/template (renderTemplate)
  └── lib/fs-utils (atomicWrite, ensureDir)

knowledge-update.service.ts
  ├── lib/config (readConfig, resolveBasePaths)
  ├── lib/scanner (scanDir)
  ├── lib/template (renderTemplate)
  ├── lib/content-merger (mergeContent)
  ├── lib/fs-utils (atomicWrite, ensureDir)
  ├── lib/yaml-utils (parseYaml, stringifyYaml)
  └── types/module-map (ModuleMap)

change-story.service.ts
  ├── lib/config (readConfig, resolveBasePaths)
  ├── lib/fs-utils (ensureDir, atomicWrite)
  ├── lib/template (renderTemplate)
  └── types/errors (AlreadyExistsError)

change-plan.service.ts
  ├── lib/config (readConfig)
  ├── lib/fs-utils (atomicWrite)
  ├── lib/template (renderTemplate)
  ├── lib/yaml-utils (parseYaml, stringifyYaml)
  ├── types/errors (PrerequisiteError)
  ├── types/change (ChangeMetadata)
  └── @inquirer/prompts (select)

change-tasks.service.ts
  ├── lib/config (readConfig)
  ├── lib/fs-utils (atomicWrite)
  ├── lib/template (renderTemplate)
  ├── lib/yaml-utils (parseYaml, stringifyYaml)
  ├── types/errors (PrerequisiteError)
  ├── types/change (ChangeMetadata)
  └── @inquirer/prompts (select)

agent-sync.service.ts
  ├── lib/config (readConfig, resolveBasePaths)
  ├── lib/template (renderTemplate)
  ├── lib/fs-utils (atomicWrite, ensureDir)
  ├── types/errors (PrerequisiteError)
  └── types/skill (SKILL_DEFINITIONS, AGENT_CONFIGS, AgentConfig, AgentSyncResult)

archive.service.ts
  ├── lib/fs-utils (ensureDir, atomicWrite)
  ├── lib/yaml-utils (parseYaml, stringifyYaml)
  ├── types/change (ChangeStatus)
  ├── types/errors (ScanError, WriteError)
  └── ./knowledge-update.service (execute)
```

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
