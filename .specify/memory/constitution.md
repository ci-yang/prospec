# Prospec Constitution

## Core Principles

### I. Progressive Disclosure First
Context window is a shared resource:
- Never load all information at once
- Provide index/summary first, details on demand
- Respect AI context limits in all designs

### II. Spec is Source of Truth
Requirements live in specs, not in code or comments:
- Changes must be documented in Patch Specs before implementation
- Code follows spec, not the other way around
- Specs are human-readable and version-controlled

### III. Zero Startup Cost for Brownfield
Existing projects can adopt Prospec incrementally:
- No requirement to document entire codebase upfront
- Start with one change, build specs over time
- AI Knowledge generated from code, not written manually

### IV. AI Agent Agnostic
Prospec works with any AI coding assistant:
- Core knowledge in universal Markdown format
- Adapter layer for specific CLI tools
- No lock-in to single AI provider

### V. User Controls the Rules
Constitution belongs to the user, not the tool:
- Users define their own project red lines
- Natural language input, not wizard/questionnaire
- Tool enforces rules, doesn't invent them

### VI. Language Policy (Bilingual Standards)
Clear separation between documentation language and code language:
- **Documentation outputs** (spec.md, plan.md, tasks.md): MUST be written in Traditional Chinese
- **Code artifacts** (source code, variable names, function names, comments in code): MUST be written in English
- **Technical terms**: May retain English where translation would reduce clarity (e.g., API, CLI, YAML)
- **File names**: MUST use English

## Quality Standards

### Code Quality
- All user-facing errors must have actionable messages
- No silent failures
- Verbose mode available for debugging

### Documentation Quality
- Generated docs must be human-readable
- No placeholder text in outputs
- Clear structure with consistent formatting

### User Experience
- Commands should be discoverable (--help everywhere)
- Consistent command structure across all operations
- Provide suggestions on errors, not just error messages

## Forbidden Practices

- MUST NOT require full codebase documentation before use
- MUST NOT lock users into specific AI tool
- MUST NOT generate unreadable or overly verbose output
- MUST NOT fail silently without explanation
- MUST NOT make decisions without user awareness

## Governance

- Constitution principles override implementation convenience
- Amendments require explicit documentation and approval
- When in doubt, favor user control over automation

**Version**: 1.1.0 | **Ratified**: 2026-02-03 | **Last Amended**: 2026-02-03

<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0

Added sections:
- Principle VI: Language Policy (Bilingual Standards)

Modified principles: None
Removed sections: None

Templates requiring updates:
- .specify/templates/spec-template.md ✓ updated
- .specify/templates/plan-template.md ✓ updated
- .specify/templates/tasks-template.md ✓ updated

Follow-up TODOs: None
-->
