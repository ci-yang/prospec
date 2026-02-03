> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# 資料模型：Prospec MVP CLI

**Branch**: `001-prospec-mvp-cli` | **Date**: 2026-02-03

## Entity: ProspecConfig（`.prospec.yaml`）

專案配置檔，記錄所有 Prospec 設定。

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | NO | Prospec 配置版本（預設 `"1.0"`） |
| `project.name` | string | YES | 專案名稱 |
| `project.version` | string | NO | 專案版本 |
| `tech_stack.language` | string | NO | 程式語言（auto-detect） |
| `tech_stack.framework` | string | NO | 框架名稱（auto-detect） |
| `tech_stack.package_manager` | string | NO | 套件管理工具（auto-detect） |
| `paths` | Record<string, string> | NO | 架構層路徑模式（key 為自訂層名，value 為 glob pattern） |
| `exclude` | string[] | NO | 排除的檔案模式（預設含 `*.env*`、`*credential*`、`*secret*`） |
| `agents` | string[] | NO | 啟用的 AI Assistant 清單（由 init 互動選擇） |
| `knowledge.base_path` | string | NO | AI Knowledge 根目錄（預設 `docs/ai-knowledge`） |

### Validation Rules

- `project.name` 為必填，缺少時顯示 `"project.name 為必填欄位"`
- 不明欄位警告但不阻擋
- `agents` 有效值：`claude`、`gemini`、`copilot`、`codex`
- `paths` 為自由 key-value 結構，支援任意架構模式（MVC、Clean Architecture 等）

### Example

```yaml
version: "1.0"

project:
  name: ocelot
  version: "1.0.0"

tech_stack:
  language: typescript
  framework: express
  package_manager: npm

paths:
  models: "src/models/**/*.ts"
  services: "src/services/**/*.ts"
  routes: "src/routes/**/*.ts"
  tests: "tests/**/*.test.ts"
  # Clean Architecture 範例：
  # domain: "src/domain/**/*.ts"
  # application: "src/application/**/*.ts"
  # infrastructure: "src/infrastructure/**/*.ts"

exclude:
  - "*.env*"
  - "*credential*"
  - "*secret*"
  - "node_modules"
  - ".git"

agents:
  - claude
  - gemini

knowledge:
  base_path: docs/ai-knowledge
```

---

## Entity: ModuleMap（`docs/ai-knowledge/module-map.yaml`）

模組關聯映射，記錄專案中所有模組的結構和依賴關係。

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modules[].name` | string | YES | 模組名稱 |
| `modules[].description` | string | NO | 模組描述 |
| `modules[].paths` | string[] | YES | 模組包含的檔案路徑 |
| `modules[].keywords` | string[] | YES | 關鍵字（用於 change story 匹配） |
| `modules[].relationships.depends_on` | string[] | NO | 依賴的模組名稱 |
| `modules[].relationships.used_by` | string[] | NO | 被依賴的模組名稱 |

### Example

```yaml
modules:
  - name: lesson
    description: "Lesson management module"
    paths:
      - "src/routes/lesson/**"
      - "src/services/lesson/**"
      - "src/models/lesson.ts"
    keywords:
      - lesson
      - course
      - curriculum
    relationships:
      depends_on:
        - auth
        - database
      used_by:
        - insight
        - report
```

---

## Entity: ChangeMetadata（`metadata.yaml`）

變更元資料，追蹤變更的生命週期。

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | YES | 變更名稱（與目錄名一致） |
| `created_at` | string (ISO 8601) | YES | 建立時間 |
| `status` | enum | YES | 變更狀態 |
| `related_modules` | string[] | NO | 關聯模組名稱 |
| `description` | string | NO | 變更描述 |

### State Transitions

```
story → plan → tasks
```

- `story`: 初始建立，有 proposal.md
- `plan`: 已生成 plan.md 和 delta-spec.md
- `tasks`: 已生成 tasks.md

> 注意：`implementing` 和 `done` 狀態保留供未來版本擴展，MVP 不實作。

### Example

```yaml
name: add-gift-exchange
created_at: "2026-02-03T10:30:00Z"
status: story
related_modules:
  - lesson
  - social
description: "新增禮物交換功能"
```

---

## Entity: AIKnowledge Index（`_index.md`）

模組索引表，以 Markdown 表格呈現。

### Structure

```markdown
# AI Knowledge Index

| Module | Keywords | Status | Description | Depends On |
|--------|----------|--------|-------------|------------|
| lesson | lesson, course | active | Lesson management | auth, database |
| auth   | auth, login    | active | Authentication    | database |
```

---

## Entity: ProspecError

自訂錯誤類型，攜帶 actionable message。

### Hierarchy

```
ProspecError (base)
├── ConfigError              # .prospec.yaml 相關錯誤
│   ├── ConfigNotFound       # 檔案不存在
│   └── ConfigInvalid        # Schema 驗證失敗
├── ScanError                # 檔案掃描錯誤
├── WriteError               # 檔案寫入錯誤（含原子寫入失敗）
│   └── PermissionError      # 權限不足
├── YamlParseError           # YAML 語法錯誤（module-map.yaml、metadata.yaml 等）
├── TemplateError            # 模板解析或填充失敗
├── ModuleDetectionError     # 模組偵測失敗
├── AlreadyExistsError       # 目標已存在（init 重複、change 重複）
└── PrerequisiteError        # 前置條件未滿足（未 init、未 story）
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `message` | string | 使用者可讀的錯誤訊息 |
| `code` | string | 錯誤代碼（如 `CONFIG_NOT_FOUND`） |
| `suggestion` | string | 建議的修正方式 |

---

## Entity: ProspecSkill（Prospec Skill 配置）

描述 `prospec agent sync` 為各 AI CLI 生成的 `prospec-*` Skill 結構。

### Skill 完整清單

| Skill 名稱 | Slash Command | MVP | 說明 |
|------------|---------------|:---:|------|
| `prospec-explore` | `/prospec-explore` | ✅ | 探索模式：思考夥伴，釐清需求 |
| `prospec-new-story` | `/prospec-new-story` | ✅ | 建立新的變更需求 |
| `prospec-plan` | `/prospec-plan` | ✅ | 生成實作計劃 |
| `prospec-tasks` | `/prospec-tasks` | ✅ | 拆分任務清單 |
| `prospec-ff` | `/prospec-ff` | ✅ | 快速前進：一次生成所有 artifacts |
| `prospec-implement` | `/prospec-implement` | ✅ | 按任務清單逐項實作 |
| `prospec-verify` | `/prospec-verify` | ✅ | 驗證實作符合規格 |
| `prospec-archive` | `/prospec-archive` | Phase 2 | 歸檔完成的變更 |

### Structure（以 Claude Code 為例，MVP 7 個 Skills）

```text
.claude/skills/
├── prospec-explore/
│   └── SKILL.md
├── prospec-new-story/
│   ├── SKILL.md
│   └── references/
│       └── proposal-format.md
├── prospec-plan/
│   ├── SKILL.md
│   └── references/
│       ├── plan-format.md
│       └── delta-spec-format.md
├── prospec-tasks/
│   ├── SKILL.md
│   └── references/
│       └── tasks-format.md
├── prospec-ff/
│   └── SKILL.md
├── prospec-implement/
│   ├── SKILL.md
│   └── references/
│       └── implementation-guide.md
└── prospec-verify/
    └── SKILL.md
```

### SKILL.md Frontmatter Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | NO | Skill 名稱（預設用目錄名，`prospec-*` 格式） |
| `description` | string | YES | Skill 描述（含觸發詞，永遠在 AI context 中） |

### Agent-Specific Mapping

| AI CLI | Skill 位置 | 入口配置檔 |
|--------|-----------|-----------|
| Claude Code | `.claude/skills/prospec-*/SKILL.md` | `CLAUDE.md` |
| Gemini CLI | `.gemini/skills/prospec-*/SKILL.md` | `GEMINI.md` |
| Codex CLI | `.codex/skills/prospec-*/SKILL.md` | `AGENTS.md` |
| GitHub Copilot | `.github/instructions/prospec-*.instructions.md` | `.github/copilot-instructions.md` |

### Content Layers（Progressive Disclosure）

| Layer | 內容 | 載入時機 | Token 預算 |
|-------|------|---------|-----------|
| Layer 1 | `name` + `description` | 永遠在 AI context | ~100 tokens / skill |
| Layer 2 | SKILL.md body | Skill 觸發時 | < 500 行 |
| Layer 3 | references/*.md | AI 按需讀取 | 無限制 |

### Skill 生成資料流

```text
src/templates/skills/*.hbs + .prospec.yaml
    ↓ (prospec agent sync)
注入 context：project_name, knowledge_base_path, constitution_path, tech_stack
    ↓
依 agents 設定生成（MVP 7 個 Skills，不含 archive）：
    ├── Claude → .claude/skills/prospec-*/SKILL.md
    ├── Gemini → .gemini/skills/prospec-*/SKILL.md
    ├── Codex → .codex/skills/prospec-*/SKILL.md
    └── Copilot → .github/instructions/prospec-*.instructions.md
```

---

## Entity: AIKnowledgeTemplate（AI Knowledge 模板）

描述 `prospec init`、`prospec steering`、`prospec knowledge generate` 生成的 AI Knowledge 文件格式。

### Files Overview

| 文件 | 生成命令 | 重新生成行為 |
|------|---------|------------|
| `_index.md` | `knowledge generate` | 重新生成系統區域，保留 `<!-- prospec:user -->` 標記的使用者內容 |
| `_conventions.md` | `init` | 只生成一次骨架，後續不覆寫 |
| `architecture.md` | `steering` | 每次完整重新生成 |
| `module-map.yaml` | `steering` | 每次重新生成，comment 保留 |
| `modules/{m}/README.md` | `knowledge generate` | 重新生成系統區域，保留 `<!-- prospec:user-start/end -->` 標記的使用者區域 |

### `_index.md` Schema

| Section | Type | Description |
|---------|------|-------------|
| Header | Markdown heading + blockquote | 索引說明與用途 |
| Modules Table | Markdown table | Module, Keywords, Status, Description, Depends On |
| Project Info | Key-value list | Tech Stack, Architecture, Knowledge Base path |
| How to Use | Ordered list | AI Agent 載入策略（5 步） |

### `_conventions.md` Schema

| Section | Type | 系統/使用者 |
|---------|------|-----------|
| Naming Conventions | 提示清單 | 使用者填寫 |
| Code Patterns (Follow) | 提示清單 | 使用者填寫 |
| Code Patterns (Avoid) | 提示清單 | 使用者填寫 |
| Error Handling | 描述區域 | 使用者填寫 |
| Testing Conventions | 描述區域 | 使用者填寫 |
| Git Conventions | 描述區域 | 使用者填寫 |

### `architecture.md` Schema

| Section | Type | Description |
|---------|------|-------------|
| Tech Stack | Markdown table | Language, Framework, Package Manager |
| Directory Structure | Code block | 專案目錄樹 |
| Architecture Layers | Markdown table | Layer, Path Pattern, Description |
| Entry Points | Bullet list | 進入點路徑和描述 |
| Key Design Decisions | Markdown table | 決策, 選擇, 理由 |

### `modules/{module}/README.md` Schema

| Section | Type | Description |
|---------|------|-------------|
| Overview | Key-value metadata | Path, Keywords, Depends On, Used By |
| Key Files | Markdown table | File path, Description |
| Public API | Subsection per API | Name, Description, TypeScript signature |
| Internal Notes | Comment block | 使用者可追加備註 |

### Content Marker Convention

系統生成和使用者自訂內容使用 HTML comment 標記區分：

```markdown
<!-- prospec:auto-start -->
（系統自動生成的內容，每次重新生成會覆寫）
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
（使用者自訂內容，重新生成時保留）
<!-- prospec:user-end -->
```
