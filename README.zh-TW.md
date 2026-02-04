# Prospec

<div align="center">

[![npm version](https://img.shields.io/npm/v/prospec.svg?style=flat-square)](https://www.npmjs.com/package/prospec)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![測試](https://img.shields.io/badge/測試-263%20通過-success?style=flat-square)](tests/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)

**漸進式規格驅動開發 CLI**

*讓 AI Agent 在既有專案與新專案中都能遵循結構化工作流程*

[English](./README.md) • [快速上手](#快速上手) • [文件](./docs/)

</div>

---

## 🚀 什麼是 Prospec？

Prospec 是一套 **CLI 工具**，串接人類需求與 AI 驅動開發之間的鴻溝。它自動化專案分析、知識生成和變更管理流程 — 同時讓你的 AI 助手隨時掌握脈絡。

### 核心特色

- 🧠 **AI Knowledge 生成** — 自動從既有程式碼（Brownfield）生成結構化知識，或為新專案（Greenfield）建立骨架
- 📐 **架構分析** — 偵測技術棧、架構模式（MVC、Clean Architecture 等）與模組依賴關係
- 🤖 **AI Agent 中立** — 支援 Claude Code、Gemini CLI、GitHub Copilot 和 Codex CLI
- 🎯 **漸進式揭露** — 透過按需載入節省 70%+ tokens
- 📝 **變更管理** — 結構化的 story → plan → tasks 工作流，含 Constitution 驗證
- 🔄 **Skill 驅動** — 8 個預建 Skills（`/prospec-explore`、`/prospec-ff`、`/prospec-implement` 等）引導 AI 走完 SDD 流程

### 為什麼選擇 Prospec？

| 挑戰 | 解決方案 |
|------|---------|
| AI 不了解你的程式碼庫 | `prospec knowledge init` + `/prospec-knowledge-generate` 自動掃描並生成 AI 可讀文件 |
| Context window 限制 | 漸進式揭露：先載入摘要，細節按需取用 |
| AI 工作流不一致 | 結構化 Skills 強制執行 story → plan → tasks → implement → verify 流程 |
| 供應商鎖定 | 支援 4+ AI CLI，知識儲存在通用 Markdown 格式 |

---

## 📦 安裝

### 全域安裝（建議）

```bash
npm install -g prospec
```

### 本地開發

```bash
git clone https://github.com/your-org/prospec.git
cd prospec
npm install
npm run build
npm link
```

### 前置需求

- **Node.js** ≥ 20.0.0（或 **Bun** ≥ 1.0）
- **AI CLI**（至少一個）：
  - [Claude Code](https://docs.anthropic.com/claude/docs/claude-code)（推薦）
  - [Gemini CLI](https://ai.google.dev/gemini-api/docs/cli)
  - [GitHub Copilot CLI](https://docs.github.com/copilot/github-copilot-in-the-cli)
  - Codex CLI

---

## 🎬 快速上手

### Greenfield 工作流程（新專案）

```bash
# 1. 初始化專案
mkdir my-project && cd my-project
prospec init --name my-project
# → 選擇要啟用的 AI Assistant（互動式 checkbox）
# → 建立 .prospec.yaml + 目錄結構

# 2. 同步 AI Agent 配置 + 生成 Skills
prospec agent sync
# → 生成 CLAUDE.md + .claude/skills/prospec-*/SKILL.md

# 3. 使用 Skills 進行功能開發（在 AI Agent 中）
/prospec-new-story        # 建立變更需求
/prospec-plan             # 生成實作計劃
/prospec-tasks            # 拆分任務清單
/prospec-implement        # 逐項實作
/prospec-verify           # 驗證實作

# 或一次到位
/prospec-ff               # 快速生成 story → plan → tasks
```

### Brownfield 工作流程（既有專案）

```bash
# 1. 在既有專案中初始化
cd existing-project
prospec init
# → 自動偵測技術棧
# → 選擇 AI Assistant

# 2. 同步 AI 配置 + 生成 Skills
prospec agent sync
# → 生成 CLAUDE.md + .claude/skills/prospec-*/SKILL.md

# 3. 掃描專案並生成原始資料
prospec knowledge init
# → 生成 raw-scan.md + 空骨架（_index.md、_conventions.md）

# 4. AI 驅動模組分析（在 AI Agent 中）
/prospec-knowledge-generate
# → AI 讀取 raw-scan.md，決定模組切割
# → 建立 modules/*/README.md + 填充 _index.md

# 5. 使用 Skills 進行開發
/prospec-explore          # 探索和釐清需求
/prospec-ff add-feature   # 快速生成所有 artifacts
/prospec-implement        # 開始寫程式
```

---

## 📚 CLI 命令

### 基礎設施命令

| 命令 | 說明 |
|------|------|
| `prospec init [options]` | 初始化 Prospec 專案結構 |
| `prospec knowledge init [--depth <n>]` | 掃描專案並生成 raw-scan.md + 骨架 |
| `prospec agent sync [--cli <name>]` | 同步 AI Agent 配置 + 生成 Skills |
| `prospec steering [options]` | *(deprecated)* 分析既有專案架構 |
| `prospec knowledge generate` | *(deprecated)* 生成 AI Knowledge 文件 |

### 變更管理命令

| 命令 | 說明 |
|------|------|
| `prospec change story <name>` | 建立變更需求（骨架） |
| `prospec change plan [--change <name>]` | 生成實作計劃（骨架） |
| `prospec change tasks [--change <name>]` | 拆分任務清單（骨架） |

> **注意**：CLI 命令建立**骨架**；AI Agent（透過 Skills）填充內容。

---

## 🤖 AI Skills

Prospec 生成 8 個 Skills 引導 AI 走完 SDD 工作流：

| Skill | Slash Command | 說明 |
|-------|---------------|------|
| **探索** | `/prospec-explore` | 思考夥伴，協助釐清需求 |
| **新需求** | `/prospec-new-story` | 建立結構化的變更需求 |
| **計劃** | `/prospec-plan` | 生成實作計劃 |
| **任務** | `/prospec-tasks` | 拆分為可執行的任務 |
| **快速前進** | `/prospec-ff` | 一次生成 story → plan → tasks |
| **實作** | `/prospec-implement` | 逐項實作任務 |
| **驗證** | `/prospec-verify` | 對照規格 + Constitution 驗證 |
| **知識生成** | `/prospec-knowledge-generate` | AI 驅動的模組分析與知識建立 |

### Skill 使用範例

```bash
# 在 Claude Code / Gemini CLI / Copilot 中
/prospec-ff add-authentication

# AI 會自動：
# 1. 呼叫 `prospec change story add-authentication`
# 2. 填充 proposal.md（User Story 格式）
# 3. 呼叫 `prospec change plan`
# 4. 填充 plan.md + delta-spec.md
# 5. 呼叫 `prospec change tasks`
# 6. 填充 tasks.md（含複雜度估算）
# 7. 輸出摘要 + 下一步建議
```

---

## 🏗️ 架構

Prospec 採用 **Pragmatic Layered Architecture**（務實分層架構）遵循 CLI 開發最佳實踐：

```
src/
├── cli/          — Commander.js 命令 + 格式化輸出
├── services/     — 業務邏輯（8 個 service，每命令一個）
├── lib/          — 純工具函數（config、fs、logger 等）
├── types/        — Zod schema + TypeScript 型別
└── templates/    — Handlebars 模板（30 個 .hbs 檔案）
```

### 技術棧

- **CLI 框架**：Commander.js 14 + @inquirer/prompts 8
- **驗證**：Zod 4
- **模板引擎**：Handlebars 4.7
- **檔案掃描**：fast-glob 3.3
- **YAML**：eemeli/yaml 2.x（保留 comment）
- **測試**：Vitest 4.0 + memfs
- **TypeScript**：5.9

---

## 🧪 測試

```bash
# 執行所有測試（263 個測試）
npm test

# Watch 模式
npm run test:watch

# 型別檢查
npm run typecheck

# Lint
npm run lint
```

**測試覆蓋率**：263 個測試橫跨 4 大類：
- Unit tests（lib + services）：158 tests
- Contract tests（CLI 輸出 + Skill 格式）：73 tests
- Integration tests：15 tests
- E2E tests：17 tests

---

## 📖 專案結構

執行 `prospec init` 後：

```
your-project/
├── .prospec.yaml              # Prospec 配置
├── AGENTS.md                  # 通用 agent 指令
├── CLAUDE.md                  # Claude Code 配置（<100 行）
├── docs/
│   ├── CONSTITUTION.md        # 專案規則（使用者定義）
│   ├── specs/                 # Main specs（累積）
│   └── ai-knowledge/
│       ├── _index.md          # 模組索引（Markdown 表格）
│       ├── _conventions.md    # 專案慣例
│       ├── raw-scan.md        # 自動生成的專案掃描資料
│       ├── architecture.md    # 架構分析（via steering）
│       ├── module-map.yaml    # 模組依賴關係（via steering）
│       └── modules/
│           └── {module}/
│               └── README.md  # 模組專屬文件
├── .prospec/changes/
│   └── {change-name}/
│       ├── proposal.md        # User Story + 驗收標準
│       ├── plan.md            # 實作計劃
│       ├── tasks.md           # 任務拆解（checkbox 格式）
│       ├── delta-spec.md      # Patch Spec（ADDED/MODIFIED/REMOVED）
│       └── metadata.yaml      # 變更生命週期 metadata
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

## 🎯 核心原則（Constitution）

Prospec 強制執行 6 大核心原則：

1. **Progressive Disclosure First** — 永遠不要一次載入所有資訊；索引 → 細節
2. **Spec is Source of Truth** — 變更在寫程式碼前先記錄在規格中
3. **Zero Startup Cost for Brownfield** — 不需要預先文件化整個程式碼庫
4. **AI Agent Agnostic** — 透過 Markdown adapters 支援任何 AI CLI
5. **User Controls the Rules** — Constitution 由使用者定義，工具負責強制執行
6. **Language Policy** — 文件用繁體中文，程式碼用英文

---

## 🤝 貢獻

我們歡迎貢獻！請參考 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解指引。

### 開發環境設定

```bash
# Clone 並安裝
git clone https://github.com/your-org/prospec.git
cd prospec
npm install

# Dev 模式執行
npm run dev

# 建置
npm run build

# 測試
npm test
```

---

## 📄 授權

MIT License - 詳見 [LICENSE](./LICENSE)。

---

## 🙏 致謝

Prospec 的設計靈感來自：

- [OpenSpec](https://github.com/openspec-ai/openspec) — Delta Specs、Fast-Forward、Archive
- [Spec-Kit](https://github.com/anthropics/spec-kit) — Constitution 驗證
- [cc-sdd](https://github.com/kiro-ai/cc-sdd) — Steering 分析、模板自訂
- [BMAD](https://github.com/bmad-ai/bmad) — Analyst 角色（prospec-explore）

Prospec 的獨特貢獻：**CLI + Skills 混合** — CLI 負責確定性操作，Skills 負責 AI 引導。

---

## 🔗 連結

- [文件](./docs/)
- [快速上手指南](./specs/001-prospec-mvp-cli/quickstart.md)
- [架構概述](./specs/001-prospec-mvp-cli/plan.md)
- [資料模型](./specs/001-prospec-mvp-cli/data-model.md)

---

<div align="center">

**用 ❤️ 為 AI 驅動開發社群打造**

[⬆ 回到頂端](#prospec)

</div>
