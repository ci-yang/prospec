> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# 快速上手：Prospec MVP CLI

**Branch**: `001-prospec-mvp-cli` | **Date**: 2026-02-03

## 安裝

```bash
# npm
npm install -g prospec

# 或使用 Bun
bun install -g prospec
```

## Greenfield 工作流程（新專案）

```bash
# 1. 初始化專案
mkdir my-project && cd my-project
prospec init --name my-project
# → 選擇要啟用的 AI Assistant
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

## Brownfield 工作流程（既有專案）

```bash
# 1. 初始化
cd existing-project
prospec init
# → 自動偵測技術棧
# → 選擇 AI Assistant

# 2. 分析架構
prospec steering
# → 生成 architecture.md + module-map.yaml

# 3. 生成 AI Knowledge
prospec knowledge generate
# → 為每個模組生成 README.md
# → 更新 _index.md 索引

# 4. 同步 AI 配置 + 生成 Skills
prospec agent sync
# → AI 可透過 Skills 驅動 SDD 工作流

# 5. 使用 Skills 進行功能開發
/prospec-explore          # 先探索和釐清需求
/prospec-ff add-feature   # 快速生成所有 planning artifacts
/prospec-implement        # 開始實作
```

## 開發環境設定

```bash
# Clone 並安裝依賴
git clone <repo-url>
cd prospec
npm install

# 執行測試
npm test

# 本地開發執行
npm run dev -- init --name test-project

# 建置
npm run build
```

## 命令速查表

### CLI 命令（基礎設施）

| 命令 | 說明 |
|------|------|
| `prospec init` | 初始化專案 |
| `prospec steering` | 分析架構 |
| `prospec knowledge generate` | 生成 AI Knowledge |
| `prospec agent sync` | 同步 AI 配置 + 生成 Skills |
| `prospec change story <name>` | 建立變更需求（骨架） |
| `prospec change plan` | 生成實作計劃（骨架） |
| `prospec change tasks` | 拆分任務清單（骨架） |

### AI Agent Skills（SDD 工作流）

| Skill | Slash Command | 說明 |
|-------|---------------|------|
| 探索 | `/prospec-explore` | 思考夥伴，釐清需求 |
| 新需求 | `/prospec-new-story` | 建立結構化的變更需求 |
| 計劃 | `/prospec-plan` | 生成實作計劃 |
| 任務 | `/prospec-tasks` | 拆分任務清單 |
| 快速前進 | `/prospec-ff` | 一次生成所有 artifacts |
| 實作 | `/prospec-implement` | 按任務逐項實作 |
| 驗證 | `/prospec-verify` | 驗證實作符合規格 |
| 歸檔 | `/prospec-archive` | 歸檔完成的變更（Phase 2） |
