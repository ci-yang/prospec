# dependencies

> Template module dependencies and usage patterns

<!-- prospec:auto-start -->

## Internal Dependencies

**None.** The templates module contains only resource files (.hbs templates and .md documentation). It has no TypeScript code and makes no imports.

---

## Consumed By

Templates are consumed by `lib/template.ts` via the `renderTemplate()` function, which:
1. Loads a template file by path
2. Compiles it with Handlebars
3. Renders it with the provided variables
4. Returns the rendered string

### Direct Consumers

**lib/template.ts**
- `renderTemplate(templatePath: string, variables: Record<string, any>): Promise<string>`
- Handlebars compiler and helper registration (e.g., `join` helper)

---

## Indirect Consumers

All services that generate artifacts use `renderTemplate()` to consume templates:

### services/init.ts
Consumes:
- `init/prospec.yaml.hbs`
- `init/constitution.md.hbs`
- `init/conventions.md.hbs`
- `init/index.md.hbs`
- `init/agents.md.hbs`
- `agent-configs/*.hbs` (optional, for multi-agent setup)

### services/story.ts
Consumes:
- `change/proposal.md.hbs`
- `change/metadata.yaml.hbs`

### services/plan.ts
Consumes:
- `change/plan.md.hbs`
- `change/delta-spec.md.hbs`
- Updates `change/metadata.yaml` (may use template or direct edit)

### services/tasks.ts
Consumes:
- `change/tasks.md.hbs`
- Updates `change/metadata.yaml`

### services/knowledge.ts
Consumes:
- `knowledge/raw-scan.md.hbs`
- `knowledge/module-map.yaml.hbs`
- `knowledge/index.md.hbs`
- `steering/module-readme.hbs` (for per-module README generation)

### services/steering.ts
Consumes:
- `steering/architecture.md.hbs`

### services/skill-gen.ts (if exists)
Consumes:
- `skills/*.hbs` (all Skill templates)
- `skills/references/*.hbs` (all reference format templates)

---

## Usage Pattern

```typescript
import { renderTemplate } from '../lib/template';

// Example: Render prospec.yaml
const yamlContent = await renderTemplate('init/prospec.yaml.hbs', {
  project_name: 'my-project',
  base_dir: 'prospec',
  tech_stack: {
    language: 'typescript',
    framework: 'commander',
    package_manager: 'npm'
  },
  agents: ['claude', 'gemini']
});

// Write to file
await fs.writeFile('.prospec.yaml', yamlContent, 'utf-8');
```

---

## Handlebars Helpers

`lib/template.ts` registers custom Handlebars helpers:

### join

Joins array elements with a separator:

```handlebars
{{join keywords ", "}}
{{join relationships.depends_on ", "}}
```

Used extensively in:
- `steering/module-readme.hbs`
- `knowledge/index.md.hbs`

---

## Template Resolution

Template paths are resolved relative to `src/templates/`:

```typescript
// Input: 'init/prospec.yaml.hbs'
// Resolved to: src/templates/init/prospec.yaml.hbs
const templatePath = path.join(__dirname, '../templates', templateFile);
```

---

## No Runtime Dependencies

Templates have **zero runtime dependencies** at the module level. All dependencies are managed by `lib/template.ts`:
- `handlebars` (external package)
- `fs/promises` (Node.js built-in)
- `path` (Node.js built-in)

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
