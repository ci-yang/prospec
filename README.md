# Prospec

<div align="center">

[![npm version](https://img.shields.io/npm/v/prospec.svg?style=flat-square)](https://www.npmjs.com/package/prospec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-263%20passing-success?style=flat-square)](tests/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)

**Progressive Spec-Driven Development CLI**

*Empower AI agents with structured workflows for brownfield and greenfield projects*

[繁體中文](./README.zh-TW.md) • [Getting Started](#getting-started) • [Documentation](./docs/)

</div>

---

## 🚀 What is Prospec?

Prospec is a **CLI tool** that bridges the gap between human requirements and AI-driven development. It automates project analysis, knowledge generation, and change management workflows—all while keeping your AI assistant in the loop.

### Key Features

- 🧠 **AI Knowledge Generation** — Auto-generate structured knowledge from existing codebases (brownfield) or bootstrap new projects (greenfield)
- 📐 **Architecture Analysis** — Detect tech stacks, architecture patterns (MVC, Clean Architecture, etc.), and module dependencies
- 🤖 **AI Agent Agnostic** — Works with Claude Code, Gemini CLI, GitHub Copilot, and Codex CLI
- 🎯 **Progressive Disclosure** — Save 70%+ tokens by loading context on-demand
- 📝 **Change Management** — Structured story → plan → tasks workflow with Constitution validation
- 🔄 **Skill-Driven** — 8 pre-built Skills (`/prospec-explore`, `/prospec-ff`, `/prospec-implement`, etc.) guide AI through SDD workflows

### Why Prospec?

| Challenge | Solution |
|-----------|----------|
| AI doesn't know your codebase | `prospec knowledge init` + `/prospec-knowledge-generate` auto-scan and generate AI-readable docs |
| Context window limitations | Progressive disclosure: load summary first, details on-demand |
| Inconsistent AI workflows | Structured Skills enforce story → plan → tasks → implement → verify flow |
| Vendor lock-in | Works with 4+ AI CLIs, knowledge stored in universal Markdown |

---

## 📦 Installation

### Global Install (Recommended)

```bash
npm install -g prospec
```

### Local Development

```bash
git clone https://github.com/your-org/prospec.git
cd prospec
npm install
npm run build
npm link
```

### Prerequisites

- **Node.js** ≥ 20.0.0 (or **Bun** ≥ 1.0)
- **AI CLI** (one or more):
  - [Claude Code](https://docs.anthropic.com/claude/docs/claude-code) (recommended)
  - [Gemini CLI](https://ai.google.dev/gemini-api/docs/cli)
  - [GitHub Copilot CLI](https://docs.github.com/copilot/github-copilot-in-the-cli)
  - Codex CLI

---

## 🎬 Getting Started

### Greenfield Workflow (New Projects)

```bash
# 1. Initialize project
mkdir my-project && cd my-project
prospec init --name my-project
# → Select AI assistants (interactive checkbox)
# → Creates .prospec.yaml + directory structure

# 2. Sync AI agent config + generate Skills
prospec agent sync
# → Generates CLAUDE.md + .claude/skills/prospec-*/SKILL.md

# 3. Start developing with Skills (in your AI agent)
/prospec-new-story        # Create change story
/prospec-plan             # Generate implementation plan
/prospec-tasks            # Break down tasks
/prospec-implement        # Implement task-by-task
/prospec-verify           # Validate implementation

# Or fast-forward
/prospec-ff               # Generate story → plan → tasks in one go
```

### Brownfield Workflow (Existing Projects)

```bash
# 1. Initialize in existing project
cd existing-project
prospec init
# → Auto-detect tech stack
# → Select AI assistants

# 2. Sync AI config + generate Skills
prospec agent sync
# → Generates CLAUDE.md + .claude/skills/prospec-*/SKILL.md

# 3. Scan project and generate raw data
prospec knowledge init
# → Generates raw-scan.md + empty skeleton (_index.md, _conventions.md)

# 4. AI-driven module analysis (in your AI agent)
/prospec-knowledge-generate
# → AI reads raw-scan.md, decides module partitioning
# → Creates modules/*/README.md + fills _index.md

# 5. Develop with Skills
/prospec-explore          # Explore and clarify requirements
/prospec-ff add-feature   # Fast-forward to generate all artifacts
/prospec-implement        # Start coding
```

---

## 📚 CLI Commands

### Infrastructure Commands

| Command | Description |
|---------|-------------|
| `prospec init [options]` | Initialize Prospec project structure |
| `prospec knowledge init [--depth <n>]` | Scan project and generate raw-scan.md + skeleton |
| `prospec agent sync [--cli <name>]` | Sync AI agent configs + generate Skills |
| `prospec steering [options]` | *(deprecated)* Analyze existing project architecture |
| `prospec knowledge generate` | *(deprecated)* Generate AI Knowledge docs |

### Change Management Commands

| Command | Description |
|---------|-------------|
| `prospec change story <name>` | Create change story (scaffold) |
| `prospec change plan [--change <name>]` | Generate implementation plan (scaffold) |
| `prospec change tasks [--change <name>]` | Break down tasks (scaffold) |

> **Note**: CLI commands create **scaffolds**; AI agents (via Skills) fill in content.

---

## 🤖 AI Skills

Prospec generates 8 Skills that guide AI through SDD workflows:

| Skill | Slash Command | Description |
|-------|---------------|-------------|
| **Explore** | `/prospec-explore` | Think partner for requirement clarification |
| **New Story** | `/prospec-new-story` | Create structured change story |
| **Plan** | `/prospec-plan` | Generate implementation plan |
| **Tasks** | `/prospec-tasks` | Break down into executable tasks |
| **Fast-Forward** | `/prospec-ff` | Generate story → plan → tasks in one go |
| **Implement** | `/prospec-implement` | Implement tasks one-by-one |
| **Verify** | `/prospec-verify` | Validate against spec + Constitution |
| **Knowledge Generate** | `/prospec-knowledge-generate` | AI-driven module analysis and knowledge creation |

### Skill Example

```bash
# In Claude Code / Gemini CLI / Copilot
/prospec-ff add-authentication

# AI will:
# 1. Call `prospec change story add-authentication`
# 2. Fill in proposal.md (User Story format)
# 3. Call `prospec change plan`
# 4. Fill in plan.md + delta-spec.md
# 5. Call `prospec change tasks`
# 6. Fill in tasks.md (with complexity estimates)
# 7. Output summary + next steps
```

---

## 🏗️ Architecture

Prospec uses **Pragmatic Layered Architecture** for CLI development best practices:

```
src/
├── cli/          — Commander.js commands + formatters
├── services/     — Business logic (8 services, one per command)
├── lib/          — Pure utility functions (config, fs, logger, etc.)
├── types/        — Zod schemas + TypeScript types
└── templates/    — Handlebars templates (30 .hbs files)
```

### Tech Stack

- **CLI Framework**: Commander.js 14 + @inquirer/prompts 8
- **Validation**: Zod 4
- **Templating**: Handlebars 4.7
- **File Scanning**: fast-glob 3.3
- **YAML**: eemeli/yaml 2.x (preserves comments)
- **Testing**: Vitest 4.0 + memfs
- **TypeScript**: 5.9

---

## 🧪 Testing

```bash
# Run all tests (263 tests)
npm test

# Watch mode
npm run test:watch

# Type check
npm run typecheck

# Lint
npm run lint
```

**Test Coverage**: 263 tests across 4 categories:
- Unit tests (lib + services): 158 tests
- Contract tests (CLI output + Skill format): 73 tests
- Integration tests: 15 tests
- E2E tests: 17 tests

---

## 📖 Project Structure

After running `prospec init`:

```
your-project/
├── .prospec.yaml              # Prospec config
├── AGENTS.md                  # Universal agent instructions
├── CLAUDE.md                  # Claude Code config (<100 lines)
├── docs/
│   ├── CONSTITUTION.md        # Project rules (user-defined)
│   ├── specs/                 # Main specs (cumulative)
│   └── ai-knowledge/
│       ├── _index.md          # Module index (Markdown table)
│       ├── _conventions.md    # Project conventions
│       ├── raw-scan.md        # Auto-generated project scan data
│       ├── architecture.md    # Architecture analysis (via steering)
│       ├── module-map.yaml    # Module dependencies (via steering)
│       └── modules/
│           └── {module}/
│               └── README.md  # Module-specific docs
├── .prospec/changes/
│   └── {change-name}/
│       ├── proposal.md        # User Story + acceptance criteria
│       ├── plan.md            # Implementation plan
│       ├── tasks.md           # Task breakdown (checkbox format)
│       ├── delta-spec.md      # Patch Spec (ADDED/MODIFIED/REMOVED)
│       └── metadata.yaml      # Change lifecycle metadata
└── .claude/skills/
    ├── prospec-explore/
    ├── prospec-new-story/
    ├── prospec-plan/
    ├── prospec-tasks/
    ├── prospec-ff/
    ├── prospec-implement/
    ├── prospec-verify/
    └── prospec-knowledge-generate/
```

---

## 🎯 Core Principles (Constitution)

Prospec enforces 6 core principles:

1. **Progressive Disclosure First** — Never load all info at once; index → details
2. **Spec is Source of Truth** — Changes documented in specs before code
3. **Zero Startup Cost for Brownfield** — No need to document entire codebase upfront
4. **AI Agent Agnostic** — Works with any AI CLI via Markdown adapters
5. **User Controls the Rules** — Constitution is user-defined, tool enforces
6. **Language Policy** — Docs in Traditional Chinese, code in English

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/your-org/prospec.git
cd prospec
npm install

# Run in dev mode
npm run dev

# Build
npm run build

# Test
npm test
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Prospec draws inspiration from:

- [OpenSpec](https://github.com/openspec-ai/openspec) — Delta Specs, Fast-Forward, Archive
- [Spec-Kit](https://github.com/anthropics/spec-kit) — Constitution validation
- [cc-sdd](https://github.com/kiro-ai/cc-sdd) — Steering analysis, template customization
- [BMAD](https://github.com/bmad-ai/bmad) — Analyst role (prospec-explore)

Prospec's unique contribution: **CLI + Skills hybrid** — CLI for deterministic ops, Skills for AI guidance.

---

## 🔗 Links

- [Documentation](./docs/)
- [Quickstart Guide](./specs/001-prospec-mvp-cli/quickstart.md)
- [Architecture Overview](./specs/001-prospec-mvp-cli/plan.md)
- [Data Model](./specs/001-prospec-mvp-cli/data-model.md)

---

<div align="center">

**Made with ❤️ for the AI-powered development community**

[⬆ Back to top](#prospec)

</div>
