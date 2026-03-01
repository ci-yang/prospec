# Capability Spec → Feature Spec Migration Guide

## Overview

This migration converts the spec architecture from Capability-centric (REQ ID as core unit) to Product-First (User Story as core unit).

## Mapping: Capability → Feature

| Old Capability Spec | New Feature Spec | Notes |
|---|---|---|
| `capabilities/change-workflow.md` | `features/sdd-workflow.md` | Story, Plan, Tasks, Archive, Verify, Fast-Forward |
| `capabilities/knowledge-engine.md` | `features/ai-knowledge.md` | Knowledge Init, Generate, Update, Quality Gate |
| `capabilities/project-init.md` + `capabilities/cli-infra.md` | `features/project-setup.md` | CLI, Init, Steering, Config, Base Directory |
| `capabilities/agent-sync.md` | `features/agent-integration.md` | Agent Sync, Skill Generation, Progressive Disclosure |
| _(new)_ | `features/design-phase.md` | Generate Mode, Extract Mode, Platform Adapters |

## Migration Steps

1. **Copy Feature Specs from v2-product-first/**
   ```bash
   cp -r prospec/specs/v2-product-first/features/ prospec/specs/features/
   cp prospec/specs/v2-product-first/product.md prospec/specs/product.md
   ```

2. **Verify Feature Spec format**
   - Each file has frontmatter (feature, status, last_updated, story_count, req_count)
   - User Stories under `## User Stories & Behavior Specifications`
   - REQs as h4 under their parent Story
   - `## Maintenance Rules` with Replace-in-Place

3. **Archive old specs**
   ```bash
   mv prospec/specs/capabilities/ prospec/specs/_archived-capabilities/
   mv prospec/specs/history/ prospec/specs/_archived-history/
   ```

4. **Clean up staging directories**
   ```bash
   rm -rf prospec/specs/v2-product-first/
   rm -rf prospec/specs/v2-preview/
   ```

5. **Verify by running tests**
   ```bash
   pnpm test
   ```

## Post-Migration

- Archive skill now syncs to `specs/features/` (Feature Spec Sync)
- Plan skill reads `specs/features/` for existing context
- Verify skill checks Feature Spec ↔ Knowledge consistency
- `specs/product.md` is auto-regenerated during archive
