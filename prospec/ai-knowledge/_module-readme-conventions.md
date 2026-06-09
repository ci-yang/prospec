# Module README Conventions

> How to structure an AI Knowledge module README (`modules/{module}/README.md`).
> Sibling of [`_diagram-conventions.md`](_diagram-conventions.md): that file governs diagrams *inside* knowledge docs, this one governs module README *structure*.
> **Read this before authoring or regenerating a module README** — it is the canonical template that `/prospec-knowledge-generate` and `/prospec-knowledge-update` produce against. If this file and a skill's inlined template ever diverge, this file wins.

---

## Generated vs user-authored split (marker contract)

Every module README is split by HTML-comment markers into a generated block and a user block:

```markdown
# {ProperName}
> one-line module summary

<!-- prospec:auto-start -->
... generated sections (see template below) ...
<!-- prospec:auto-end -->
<!-- prospec:user-start -->
... freeform, human-authored notes (optional) ...
<!-- prospec:user-end -->
```

- **`prospec:auto-start` … `prospec:auto-end`** delimits the block `/prospec-knowledge-generate` and `/prospec-knowledge-update` own and may rewrite. Do NOT hand-edit it expecting edits to survive regeneration — durable hand-written notes go in the user block.
- **`prospec:user-start` … `prospec:user-end`** is never overwritten by the skills. Use it for a `## Developer Notes` section or anything the generator cannot derive from the code. It may be empty.
- The title and the one-line `>` summary sit **above** `prospec:auto-start`.

## Title and summary

- Title is the module's proper name: `# Knowledge Engine`, `# Agent Sync` — **not** `# Module: services` and not the raw directory slug.
- Exactly one `>` blockquote line directly under the title: a single sentence on what the module does.

## Section template (inside the auto block)

The order is fixed. Keep each section concise; the whole README stays **≤ 100 lines / ≤ 400 tokens**.

| Section | Required | Content |
|---------|----------|---------|
| `## Key Files` | ✅ | Table `\| File \| Purpose \|` — the top ~10 files a reader must know. One-line purpose each. |
| `## Public API` | ✅ | The module's public surface — exported functions/classes (or HTTP endpoints / events for service modules). Signature + 1-line description, max ~8 entries. The agent reads source (L2) for full detail. |
| `## Dependencies` | ✅ | `**Depends on:**` (with WHY) / `**Used by:**` for internal modules; list external systems where relevant. |
| `## Modification Guide` | ✅ | Numbered "to change X, edit Y → Z" recipes for the common edits. This is more valuable than an API dump — tell agents HOW to change. |
| `## Ripple Effects` | ⬜ | Larger modules only: what downstream breaks when you touch a shared piece. Omit for small leaf modules. |
| `## Pitfalls` | ✅ | Known traps, surprising names, non-obvious invariants, anti-patterns. |

## Skeleton

```markdown
# {ProperName}
> {one-line summary}

<!-- prospec:auto-start -->
## Key Files
| File | Purpose |
|------|---------|
| `path/to/file` | ... |

## Public API
- `functionName()` — what it does (1-line)
- `ClassName` — what it does (1-line)

## Dependencies
**Depends on:** `module-a` (why), `module-b` (why)
**Used by:** `module-c`, `module-d`

## Modification Guide
1. **Add X** — edit `file` → update `other-file`

## Pitfalls
- ...
<!-- prospec:auto-end -->
<!-- prospec:user-start -->
<!-- prospec:user-end -->
```

## Principles

- **Modification Guide > API Reference** — tell agents HOW to change, not just WHAT exists.
- **No api-surface.md, dependencies.md, or patterns.md** — everything consolidates into this one README.
- **README is a map, not a copy** — point to source files; never duplicate source code or full signatures.
