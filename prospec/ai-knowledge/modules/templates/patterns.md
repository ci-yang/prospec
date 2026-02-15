# patterns

> Template design patterns and conventions

<!-- prospec:auto-start -->

## Template Patterns

### 1. Variable Naming Convention

**Pattern:** Use `snake_case` for all Handlebars variables.

**Rationale:** Consistency with YAML conventions and compatibility with AI agent naming patterns.

**Examples:**

```handlebars
{{project_name}}
{{change_name}}
{{knowledge_base_path}}
{{constitution_path}}
{{base_dir}}
{{tech_stack.language}}
```

**Never:**
```handlebars
{{projectName}}  ❌ (camelCase)
{{ProjectName}}  ❌ (PascalCase)
```

---

### 2. Content Markers for Incremental Updates

**Pattern:** Use HTML comment markers to delineate auto-generated vs. user-editable sections.

**Purpose:** Enable `lib/content-merger.ts` to preserve user edits while regenerating auto-managed sections.

**Example from `steering/module-readme.hbs`:**

```handlebars
## Key Files

<!-- prospec:auto-start -->
| File | Description |
|------|-------------|
{{#each key_files}}| `{{this.path}}` | {{this.description}} |
{{/each}}
<!-- prospec:auto-end -->

## Internal Notes

<!-- prospec:user-start -->
<!-- Add your notes about this module here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
```

**Marker Types:**
- `<!-- prospec:auto-start -->` / `<!-- prospec:auto-end -->` — Auto-generated content
- `<!-- prospec:user-start -->` / `<!-- prospec:user-end -->` — User-editable content

---

### 3. YAML Front Matter in Skill Templates

**Pattern:** Skill templates include YAML front matter for metadata that gets parsed by the Skill generation service.

**Example from `skills/prospec-new-story.hbs`:**

```handlebars
---
name: prospec-new-story
description: "New Story | 新增故事 - Create change requests by guiding User Story and acceptance criteria definition. Triggers: new feature, requirement, story, I want to, change, 新功能, 需求, 我想做, 新增功能, 變更"
---

# Prospec New Story Skill

## Activation
...
```

**Fields:**
- `name` (string) — Skill identifier (kebab-case)
- `description` (string) — English description | Chinese description - full explanation. Triggers: keyword list

**Used by:** Skill registration and discovery systems

---

### 4. Chinese Content Support

**Pattern:** Some templates include Chinese placeholder text for user-facing content, while Skill instructions remain in English.

**Example from `change/proposal.md.hbs`:**

```handlebars
## User Story

As a [角色/使用者類型],
I want [功能/需求],
So that [目的/價值].

## Acceptance Criteria

1. [具體可驗證的條件 1]
2. [具體可驗證的條件 2]
3. [具體可驗證的條件 3]
```

**Rationale:** Prospec is designed for Chinese-speaking development teams. User-facing artifacts (proposal.md, delta-spec.md, tasks.md) default to Chinese, while AI agent instructions remain in English for clarity.

**Affected Templates:**
- `change/proposal.md.hbs`
- `change/delta-spec.md.hbs`
- `change/tasks.md.hbs`
- `change/plan.md.hbs`

---

### 5. Conditional Blocks for Optional Data

**Pattern:** Use `{{#if}}` / `{{#unless}}` to handle optional variables gracefully.

**Example from `init/prospec.yaml.hbs`:**

```handlebars
{{#if tech_stack}}
tech_stack:
{{#if tech_stack.language}}
  language: {{tech_stack.language}}
{{/if}}
{{#if tech_stack.framework}}
  framework: {{tech_stack.framework}}
{{/if}}
{{#if tech_stack.package_manager}}
  package_manager: {{tech_stack.package_manager}}
{{/if}}
{{/if}}
```

**Example from `steering/module-readme.hbs`:**

```handlebars
{{#if relationships.depends_on.length}}| Depends On | {{join relationships.depends_on ", "}} |
{{/if}}{{#if relationships.used_by.length}}| Used By | {{join relationships.used_by ", "}} |
{{/if}}
```

**Benefits:**
- Avoids rendering empty sections
- Keeps generated output clean
- Gracefully handles missing data

---

### 6. Iteration with Contextual Variables

**Pattern:** Use `{{#each}}` for array iteration with `this` for current item context.

**Example from `change/proposal.md.hbs`:**

```handlebars
{{#if related_modules}}
## Related Modules

{{#each related_modules}}
- **{{this.name}}**: {{this.description}}
{{/each}}
{{else}}
## Related Modules

_No related modules detected. Run `prospec steering` and `prospec knowledge generate` first for module matching._
{{/if}}
```

**Example from `steering/module-readme.hbs`:**

```handlebars
## Key Files

| File | Description |
|------|-------------|
{{#each key_files}}| `{{this.path}}` | {{this.description}} |
{{/each}}
```

---

### 7. Helper Usage for Array Formatting

**Pattern:** Use the `join` custom helper for comma-separated lists.

**Example from `steering/module-readme.hbs`:**

```handlebars
| Keywords | {{join keywords ", "}} |
| Depends On | {{join relationships.depends_on ", "}} |
| Used By | {{join relationships.used_by ", "}} |
```

**Implementation (in `lib/template.ts`):**

```typescript
Handlebars.registerHelper('join', (array: string[], separator: string) => {
  return array && array.length > 0 ? array.join(separator) : '';
});
```

---

### 8. Reference Format Templates

**Pattern:** Skill reference templates provide format specifications that Skill workflows load on-demand.

**Structure:**

```markdown
# [Format Name] Format Reference

This document defines the expected format for `[artifact-name]`, used by the **[skill-name]** Skill.

---

## Purpose
...

## Standard Format
...

## File Length Guidelines
...

## Reference Information
- Project name: `{{project_name}}`
- AI Knowledge path: `{{knowledge_base_path}}`
- Constitution file: `{{constitution_path}}`
```

**Example from `skills/references/proposal-format.hbs`:**

```handlebars
# Proposal Format Reference

This document defines the expected format for `proposal.md`, used by the **prospec-new-story** Skill.
...
```

**Usage in Skills:**

```handlebars
## Startup Loading

1. Read `{{knowledge_base_path}}/_index.md` — identify related modules
2. Read `{{constitution_path}}` — prepare Constitution check
3. **MANDATORY** — Read [`references/proposal-format.md`](references/proposal-format.md) for proposal.md format specification
```

---

### 9. Category-Based Organization

**Pattern:** Templates are organized by functional category, mirroring the prospec workflow stages.

**Directory Structure:**

```
src/templates/
  init/           — Project initialization (prospec.yaml, constitution.md, etc.)
  change/         — Change workflow (proposal.md, plan.md, tasks.md, etc.)
  knowledge/      — AI Knowledge generation (raw-scan.md, module-map.yaml, index.md)
  steering/       — Architectural docs (architecture.md, module-readme.hbs)
  agent-configs/  — AI agent configs (claude.md, gemini.md, etc.)
  skills/         — Skill workflow templates (prospec-*.hbs)
  skills/references/ — Format specifications for Skills
```

**Benefits:**
- Clear separation of concerns
- Easy to locate templates by workflow stage
- Mirrors the conceptual model of prospec

---

### 10. Variable Documentation in Templates

**Pattern:** Reference templates include `## Reference Information` sections documenting available variables.

**Example from `skills/references/proposal-format.hbs`:**

```handlebars
## Reference Information

- Project name: `{{project_name}}`
- AI Knowledge path: `{{knowledge_base_path}}`
- Constitution file: `{{constitution_path}}`
```

**Purpose:**
- Self-documenting templates
- Helps AI agents understand available context
- Guides developers when modifying templates

---

### 11. Fallback Text for Empty Data

**Pattern:** Provide helpful fallback text when optional data is missing.

**Example from `steering/module-readme.hbs`:**

```handlebars
{{#each public_api}}- **{{this.name}}**: {{this.description}}
{{/each}}
{{#unless public_api}}(No public API detected yet — run `prospec knowledge generate` to populate)
{{/unless}}
```

**Example from `change/proposal.md.hbs`:**

```handlebars
{{#if description}}
- {{description}}
{{else}}
- [額外的上下文或技術考量]
{{/if}}
```

**Benefits:**
- Guides users on next steps
- Prevents empty sections
- Maintains document structure even with incomplete data

---

## Anti-Patterns (Avoid)

### ❌ Complex Logic in Templates

**Bad:**
```handlebars
{{#if (and tech_stack (or tech_stack.language tech_stack.framework))}}
  ...
{{/if}}
```

**Good:**
Pre-process data in the service layer, pass simplified variables to templates.

---

### ❌ Hardcoded Paths

**Bad:**
```handlebars
Read `docs/CONSTITUTION.md`
```

**Good:**
```handlebars
Read `{{constitution_path}}`
```

---

### ❌ Mixing Languages in Instruction Sections

**Bad:**
```handlebars
## Workflow

當觸發時，請... (混雜中英文)
```

**Good:**
- Skill instructions: Pure English
- User-facing content placeholders: Chinese (if target audience is Chinese-speaking)

---

## Template Evolution

As prospec evolves, new templates should:
1. Follow snake_case variable naming
2. Include content markers if intended for incremental updates
3. Use YAML front matter for Skill templates
4. Provide fallback text for empty data
5. Document available variables in reference templates
6. Organize by category
7. Use custom helpers for common formatting tasks

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
