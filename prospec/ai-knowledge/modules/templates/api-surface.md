# api-surface

> Template files, required variables, and consuming services

<!-- prospec:auto-start -->

## Template API Surface

For template resources, the "API surface" consists of:
1. **Template file paths** (relative to `src/templates/`)
2. **Required variables** (Handlebars variables used in the template)
3. **Consuming service** (which service calls `renderTemplate()` with this template)

---

## init/ Templates

### prospec.yaml.hbs

**Required Variables:**
- `project_name` (string)
- `base_dir` (string)
- `tech_stack?` (object, optional)
  - `tech_stack.language?` (string)
  - `tech_stack.framework?` (string)
  - `tech_stack.package_manager?` (string)
- `agents?` (string[], optional)

**Consumed by:** `services/init.ts`

---

### constitution.md.hbs

**Required Variables:**
- `project_name` (string)

**Consumed by:** `services/init.ts`

---

### conventions.md.hbs

**Required Variables:**
- (likely none or minimal project metadata)

**Consumed by:** `services/init.ts`

---

### index.md.hbs

**Required Variables:**
- `project_name` (string)
- `base_dir` (string)

**Consumed by:** `services/init.ts`

---

### agents.md.hbs

**Required Variables:**
- (likely project metadata or agent list)

**Consumed by:** `services/init.ts`

---

## change/ Templates

### proposal.md.hbs

**Required Variables:**
- `change_name` (string)
- `related_modules?` (array of objects, optional)
  - `related_modules[].name` (string)
  - `related_modules[].description` (string)
- `description?` (string, optional)

**Consumed by:** `services/story.ts`

---

### metadata.yaml.hbs

**Required Variables:**
- `change_name` (string)
- `status` (string: "story", "planning", "tasks", "implementing", "verifying", "verified")
- `created_at` (string, ISO date)

**Consumed by:** `services/story.ts`, `services/plan.ts`, `services/tasks.ts`

---

### plan.md.hbs

**Required Variables:**
- `change_name` (string)
- (other variables TBD from plan service)

**Consumed by:** `services/plan.ts`

---

### delta-spec.md.hbs

**Required Variables:**
- `change_name` (string)

**Consumed by:** `services/plan.ts`

---

### tasks.md.hbs

**Required Variables:**
- `change_name` (string)
- (likely task list data)

**Consumed by:** `services/tasks.ts`

---

## knowledge/ Templates

### raw-scan.md.hbs

**Required Variables:**
- `project_name` (string)
- `file_tree` (string, directory tree output)
- `key_files` (array)

**Consumed by:** `services/knowledge.ts`

---

### module-map.yaml.hbs

**Required Variables:**
- `modules` (array of module objects)

**Consumed by:** `services/knowledge.ts`

---

### index.md.hbs

**Required Variables:**
- `project_name` (string)
- `modules` (array)

**Consumed by:** `services/knowledge.ts`

---

## steering/ Templates

### architecture.md.hbs

**Required Variables:**
- `project_name` (string)
- (architectural analysis data)

**Consumed by:** `services/steering.ts`

---

### module-readme.hbs

**Required Variables:**
- `module_name` (string)
- `description` (string)
- `path` (string)
- `keywords` (string[])
- `relationships` (object)
  - `relationships.depends_on` (string[])
  - `relationships.used_by` (string[])
- `key_files` (array)
  - `key_files[].path` (string)
  - `key_files[].description` (string)
- `public_api?` (array, optional)
  - `public_api[].name` (string)
  - `public_api[].description` (string)

**Consumed by:** `services/knowledge.ts`

---

## agent-configs/ Templates

### claude.md.hbs

**Required Variables:**
- `project_name` (string)
- `base_dir` (string)
- `tech_stack?` (object, optional)

**Consumed by:** `services/init.ts` or agent config generation

---

### gemini.md.hbs

**Required Variables:**
- Similar to claude.md.hbs

**Consumed by:** `services/init.ts` or agent config generation

---

### copilot.md.hbs

**Required Variables:**
- Similar to claude.md.hbs

**Consumed by:** `services/init.ts` or agent config generation

---

### codex.md.hbs

**Required Variables:**
- Similar to claude.md.hbs

**Consumed by:** `services/init.ts` or agent config generation

---

## skills/ Templates

All Skill templates follow a similar pattern with YAML front matter and workflow instructions.

### Common Variables in Skill Templates:

- `knowledge_base_path` (string)
- `constitution_path` (string)
- `project_name` (string)
- `base_dir` (string)

### Skill Template List:

1. **prospec-explore.hbs** — Consumed by: Skill generation service
2. **prospec-new-story.hbs** — Consumed by: Skill generation service
3. **prospec-plan.hbs** — Consumed by: Skill generation service
4. **prospec-tasks.hbs** — Consumed by: Skill generation service
5. **prospec-ff.hbs** — Consumed by: Skill generation service
6. **prospec-verify.hbs** — Consumed by: Skill generation service
7. **prospec-implement.hbs** — Consumed by: Skill generation service
8. **prospec-knowledge-generate.hbs** — Consumed by: Skill generation service
9. **prospec-knowledge-update.hbs** — Consumed by: Skill generation service
10. **prospec-archive.hbs** — Consumed by: Skill generation service

---

## skills/references/ Templates

Reference templates provide format specifications and examples. They are loaded by Skill workflows.

### Reference Template List:

1. **proposal-format.hbs**
2. **plan-format.hbs**
3. **delta-spec-format.hbs**
4. **tasks-format.hbs**
5. **implementation-guide.hbs**
6. **patterns-format.hbs**
7. **api-surface-format.hbs**
8. **dependencies-format.hbs**
9. **endpoints-format.hbs**
10. **components-format.hbs**
11. **screens-format.hbs**
12. **knowledge-generate-format.hbs**
13. **knowledge-format.hbs**
14. **archive-format.hbs**
15. **knowledge-update-format.hbs**

**Common Variables:**
- `project_name` (string)
- `knowledge_base_path` (string)
- `constitution_path` (string)

**Consumed by:** Loaded by Skill templates during workflow execution

---

## CLAUDE.md Files

Three CLAUDE.md files exist for claude-mem context storage:
- `agent-configs/CLAUDE.md`
- `skills/CLAUDE.md`
- `skills/references/CLAUDE.md`

These are not templates but rather static context files for AI agent memory.

<!-- prospec:auto-end -->

<!-- prospec:user-start -->
<!-- Add custom notes here. This section is preserved on regeneration. -->
<!-- prospec:user-end -->
