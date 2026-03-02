# templates

> Handlebars template library for all generated artifacts (57 files: 54 .hbs + 3 .md)

<!-- prospec:auto-start -->

## Key Files

| File | Purpose |
|------|---------|
| `src/templates/init/prospec.yaml.hbs` | .prospec.yaml initialization template |
| `src/templates/steering/architecture.md.hbs` | Architecture document generation |
| `src/templates/steering/module-readme.hbs` | Recipe-First module README template |
| `src/templates/knowledge/index.md.hbs` | _index.md with Loading Rules and module table |
| `src/templates/knowledge/raw-scan.md.hbs` | Raw scan output template |
| `src/templates/skills/*.hbs` | 11 skill templates (plan, implement, verify, etc.) |
| `src/templates/skills/references/*.md` | 24 reference documents for skills |
| `src/templates/change/*.hbs` | Change workflow templates (proposal, plan, delta-spec, tasks) |
| `src/templates/agent-configs/*.hbs` | Agent config templates (Claude, Gemini, Copilot, Codex) |

## Public API

- Templates consumed via `renderTemplate(name, context)` from `lib/template.ts`
- No direct exports — pure resource files

## Dependencies

- **depends_on**: None (pure resources, no imports)
- **used_by**: `lib/template.ts` → consumed by `services/*` and `cli/formatters/*`

## Modification Guide

1. Editing a template: Modify `.hbs` file directly. Variables use `{{variable}}` syntax.
2. Adding a template: Create in appropriate subdir, call via `renderTemplate('subdir/name.hbs', ctx)`.
3. Adding a skill: Create `skills/prospec-{name}.hbs`, add to `SKILL_DEFINITIONS` in `types/skill.ts`.
4. Template variables must exactly match context object keys from service code.

## Ripple Effects

- `module-readme.hbs` changes affect ALL module README output — verify contract test
- `index.md.hbs` changes affect _index.md format — update knowledge-generate and knowledge-update skills
- Skill template changes require `agent-sync` to redeploy to `.claude/skills/`
- Reference file changes affect skill behavior instructions

## Pitfalls

- Handlebars variables NOT validated at compile time — typos produce empty output silently
- `{{#each}}` blocks fail silently on undefined arrays — ensure context passes arrays, not undefined
- Skill templates generate Markdown — watch for double escaping
- Reference files copied verbatim — not processed through Handlebars

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- prospec:user-end -->
