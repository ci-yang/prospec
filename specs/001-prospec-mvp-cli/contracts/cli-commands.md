> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# CLI 命令契約：Prospec MVP CLI

**Branch**: `001-prospec-mvp-cli` | **Date**: 2026-02-03

## Global Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--version`, `-V` | flag | — | 顯示版本號 |
| `--help`, `-h` | flag | — | 顯示說明 |
| `--verbose` | flag | false | 啟用詳細輸出 |
| `--quiet`, `-q` | flag | false | 靜默模式（只輸出結果，適合 CI/CD） |

---

## `prospec init`

初始化 Prospec 專案結構。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--name <name>` | string | 目錄名稱 | 指定專案名稱 |
| `--agents <list>` | string | — | 以逗號分隔的 agent 清單（跳過互動選擇，適合 CI/CD） |

### Interactive Prompts

1. **AI Assistant 選擇**（checkbox）：
   - 顯示所有支援的 AI CLI
   - 已偵測到的預設勾選
   - 未安裝的標示提醒

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | `.prospec.yaml` 已存在（AlreadyExistsError） |

### Output（normal mode）

```
✓ Created .prospec.yaml
✓ Created docs/ai-knowledge/
✓ Created docs/CONSTITUTION.md
✓ Created AGENTS.md
✓ Created docs/specs/

Tech stack detected: TypeScript / Node.js

AI Assistants:
  ✓ Claude Code (detected)
  ✓ Gemini CLI (detected)
  ○ GitHub Copilot CLI (not installed)
  ○ Codex CLI (not installed)

Selected agents: claude, gemini

→ Run `prospec agent sync` to generate AI configurations
```

---

## `prospec steering`

分析現有專案架構。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | flag | false | 只預覽，不寫入檔案 |
| `--depth <n>` | number | 10 | 掃描深度 |

### Prerequisites

- `.prospec.yaml` 必須存在

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 未初始化（PrerequisiteError） |

### Output Files

- `docs/ai-knowledge/architecture.md`
- `docs/ai-knowledge/module-map.yaml`
- `.prospec.yaml`（更新 `tech_stack` 和 `paths`）

---

## `prospec knowledge generate`

生成 AI Knowledge 文件。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | flag | false | 只預覽，不寫入檔案 |

### Prerequisites

- `.prospec.yaml` 必須存在

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 未初始化（PrerequisiteError） |

### Output Files

- `docs/ai-knowledge/modules/{module}/README.md`（每個模組）
- `docs/ai-knowledge/_index.md`（更新索引）

---

## `prospec agent sync`

同步 AI Agent 配置。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--cli <name>` | string | all | 指定特定 CLI（`claude`/`gemini`/`copilot`/`codex`） |

### Prerequisites

- `.prospec.yaml` 必須存在

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 未初始化或無可用 CLI（PrerequisiteError） |

### Output Files（以 Claude Code 為例）

- `CLAUDE.md`（專案根目錄，精簡版，< 100 行）
- `.claude/skills/prospec-explore/SKILL.md`
- `.claude/skills/prospec-new-story/SKILL.md` + `references/`
- `.claude/skills/prospec-plan/SKILL.md` + `references/`
- `.claude/skills/prospec-tasks/SKILL.md` + `references/`
- `.claude/skills/prospec-ff/SKILL.md`
- `.claude/skills/prospec-implement/SKILL.md` + `references/`
- `.claude/skills/prospec-verify/SKILL.md`

> 注意：`prospec-archive` Skill 為 Phase 2，MVP 不生成。

---

## `prospec change story <name>`

建立變更需求。

### Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | YES | 變更名稱（kebab-case） |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--description <desc>` | string | — | 變更描述 |

### Prerequisites

- `.prospec.yaml` 必須存在

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 未初始化（PrerequisiteError）或目錄已存在（AlreadyExistsError） |

### Output Files

- `.prospec/changes/{name}/proposal.md`
- `.prospec/changes/{name}/metadata.yaml`

---

## `prospec change plan`

生成實作計劃。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--change <name>` | string | auto-detect | 指定變更名稱 |

### Change Resolution Strategy

未指定 `--change` 時：
1. 掃描 `.prospec/changes/` 目錄
2. 若只有 1 個 change → 自動使用
3. 若有多個 change → 互動模式下列出清單並提示指定 `--change <name>`；`--quiet` 模式下直接報錯（exit code 1）
4. 若無 change → 顯示 PrerequisiteError

### Prerequisites

- 有效的 `proposal.md`

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 找不到 story（PrerequisiteError） |

### Output Files

- `.prospec/changes/{name}/plan.md`
- `.prospec/changes/{name}/delta-spec.md`

---

## `prospec change tasks`

拆分任務清單。

### Arguments

無。

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--change <name>` | string | auto-detect | 指定變更名稱（解析策略同 `change plan`） |

### Prerequisites

- 有效的 `plan.md`

### Exit Codes

| Code | Condition |
|------|-----------|
| 0 | 成功 |
| 1 | 找不到 plan（PrerequisiteError） |

### Output Files

- `.prospec/changes/{name}/tasks.md`（checkbox 格式，按架構層次排序，可並行任務標記 `[P]`）

---

## Phase 2 命令（MVP 不實作）

以下命令規劃在 Phase 2 實現：

- `prospec change history`：歸檔完成的變更
- `prospec change quick`：Quick Flow 一次生成所有文件
- `prospec knowledge update`：增量更新 Knowledge
- `prospec constitution`：Constitution 驗證 + 阻擋
