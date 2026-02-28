# templates

> Handlebars template files for all prospec-generated artifacts

<!-- prospec:auto-start -->

## Overview

The **templates** module contains all Handlebars (.hbs) template files used by prospec to generate configuration files, documentation, and workflow artifacts. This module has no TypeScript code—it consists purely of template resources consumed by `lib/template.ts` via the `renderTemplate()` function.

All templates support variable interpolation, conditionals, iteration, and Handlebars helpers. Many templates include content markers (`<!-- prospec:auto-start -->` / `<!-- prospec:user-start -->`) to enable safe incremental updates via ContentMerger.

## Template Categories

| Category | File Count | Purpose |
|----------|------------|---------|
| **init/** | 5 | Project initialization artifacts (prospec.yaml, constitution.md, conventions.md, index.md, agents.md) |
| **change/** | 5 | Change workflow artifacts (proposal.md, metadata.yaml, plan.md, delta-spec.md, tasks.md) |
| **knowledge/** | 3 | AI Knowledge generation (raw-scan.md, module-map.yaml, index.md) |
| **steering/** | 2 | Architectural documentation (architecture.md, module-readme.hbs) |
| **agent-configs/** | 4 | AI agent configuration files (claude.md, gemini.md, copilot.md, codex.md) |
| **skills/** | 11 | Prospec Skill templates (prospec-explore, prospec-new-story, prospec-plan, prospec-design, etc.) |
| **skills/references/** | 22 | Reference format documentation for Skills (proposal-format, plan-format, delta-spec-format, capability-spec-format, design-spec-format, adapter-*, etc.) |
| **CLAUDE.md** | 3 | Claude-specific context/memory files |

**Total:** 55 template files (52 .hbs, 3 .md)

### Key Skill Template Enhancements

| Skill | Enhancement |
|-------|-------------|
| **prospec-new-story** | Multi-story INVEST collection (Phase 4: Background, Priority, WHEN/THEN, Independent Test, Edge Cases, FR, SC) |
| **prospec-archive** | Phase 3.5 Spec Sync: delta-spec ADDED/MODIFIED/REMOVED → capability specs merge. Summary output to `specs/history/` |
| **prospec-plan** | Layer 0 capability specs loading at startup. MODIFIED references capability spec "Before" |
| **prospec-design** | Generate/Extract dual mode: Generate visual + interaction specs from proposal, or Extract from existing design tools via MCP. 4 platform adapters (pencil/Figma/Penpot/HTML) |
| **prospec-verify** | 5+1 dimension audit: tasks + spec compliance + constitution + Spec ↔ Knowledge consistency + tests + design consistency (conditional). Quality grade S/A/B/C/D |

### Key Reference Templates

| Reference | Purpose |
|-----------|---------|
| **proposal-format.hbs** | 8-section INVEST proposal: Background, User Stories (Priority + WHEN/THEN), Edge Cases, FR, SC, Related Modules, Open Questions, Constitution Check |
| **capability-spec-format.hbs** | Living requirement spec: Overview, Requirements (REQ ID + WHEN/THEN + source attribution), Edge Cases, SC, Change History, Maintenance Rules |
| **design-spec-format.hbs** | Visual design spec: Visual Identity (color/typography/spacing tokens), Components (layout/states/tokens), Responsive Strategy (breakpoints) |
| **interaction-spec-format.hbs** | Interaction spec: Screen/Component definitions (States/Transitions), Flows (trigger → action DSL draft-1), Responsive interaction differences |
| **adapter-pencil.hbs** | pencil.dev MCP adapter: batch_design()/set_variables() for Design, batch_get()/get_screenshot() for Implement, structural comparison for Verify |
| **adapter-figma.hbs** | Figma adapter: HTML prototype → html-to-figma MCP for Design, Figma MCP node reads for Implement |
| **adapter-penpot.hbs** | Penpot API adapter: API-based component creation, export, and structural comparison |
| **adapter-html.hbs** | HTML zero-dependency adapter: prototype/ directory output, CSS custom properties reading, DOM/CSS comparison |

## Handlebars Conventions

### 1. Variables

Templates use snake_case for variable names:

```handlebars
{{project_name}}
{{change_name}}
{{knowledge_base_path}}
{{base_dir}}
{{tech_stack.language}}
```

### 2. Conditionals

```handlebars
{{#if tech_stack}}
tech_stack:
  language: {{tech_stack.language}}
{{/if}}

{{#unless public_api}}
(No public API detected yet)
{{/unless}}
```

### 3. Iteration

```handlebars
{{#each agents}}
  - {{this}}
{{/each}}

{{#each related_modules}}
- **{{this.name}}**: {{this.description}}
{{/each}}
```

### 4. Helpers

Custom Handlebars helper for joining arrays:

```handlebars
{{join keywords ", "}}
{{join relationships.depends_on ", "}}
```

### 5. Content Markers

Many templates include markers for incremental updates:

```handlebars
<!-- prospec:auto-start -->
(auto-generated content)
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
(user-editable content)
<!-- prospec:user-end -->
```

These markers enable ContentMerger to preserve user edits while regenerating auto-managed sections.

### 6. YAML Front Matter (Skill Templates)

Skill templates include YAML front matter for metadata:

```handlebars
---
name: prospec-new-story
description: "New Story | 新增故事 - Create change requests..."
---
```

## Dependencies

**None.** This module contains only resource files with no internal imports.

**Consumed by:**
- `lib/template.ts` via `renderTemplate(templatePath, variables)`

**Indirectly used by:**
- All services: `services/init.ts`, `services/story.ts`, `services/plan.ts`, `services/knowledge.ts`, etc.
- Wherever artifacts are generated from templates

## Design Decisions

### Why Handlebars?

- **Simplicity**: Logic-less templates prevent complex logic creep
- **Extensibility**: Easy to add custom helpers (e.g., `join`)
- **Readability**: Human-readable syntax for both developers and AI agents
- **Safety**: No arbitrary code execution unlike some templating engines

### Why snake_case Variables?

Consistency with YAML conventions and compatibility with AI agent naming patterns.

### Why Content Markers?

Enable incremental knowledge updates—AI agents can regenerate specific sections while preserving user notes and customizations.

### Why Separate References?

Skill reference templates provide format specifications that Skills load on-demand, keeping Skill templates concise and focused on workflow logic.

### Language Neutrality

Skill templates (`.hbs`) are **language-neutral** — they contain no hardcoded output language directives. Output language is determined by the project's Constitution, CLAUDE.md, or user preferences. Structural headings (`## Activation`, `## NEVER`, etc.) remain in English as parser-recognizable markers. Change workflow templates (`proposal.md.hbs`, `delta-spec.md.hbs`) include Chinese placeholder text as the project is primarily used by Chinese-speaking teams, but this is a project-level choice, not a template-level enforcement.

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
