# agent-sync — Capability Spec

## 概述

Agent Sync 能力偵測已安裝的 AI CLI 工具，並生成對應的配置檔（CLAUDE.md、GEMINI.md、AGENTS.md）和 SDD Skill 檔案，讓 AI agent 能在 Prospec SDD 框架內工作。採用三層 Progressive Disclosure 設計節省 token。

**狀態**: Active
**最後更新**: 2026-02-16
**相關模組**: services (agent-sync), lib (agent-detector), templates (agent-configs, skills), types (skill)

## 需求規格

### 偵測與配置

### REQ-AGNT-001: 偵測已安裝的 AI CLI

讀取 `.prospec.yaml` 取得啟用的 agent，自動偵測系統上已安裝的 AI CLI 工具。

**場景：**
- WHEN `~/.claude` 存在，THEN 偵測到 Claude Code
- WHEN `~/.gemini` 存在，THEN 偵測到 Gemini CLI
- WHEN `--cli claude` 指定，THEN 只處理 Claude Code 配置
- WHEN 沒有偵測到任何已安裝的 AI CLI，THEN 顯示支援的 CLI 清單並提示安裝方式

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-002: 自動偵測 AI CLI

檢查系統目錄偵測已安裝的 AI CLI。

**場景：**
- WHEN 偵測 Claude Code，THEN 檢查 `~/.claude` 目錄是否存在
- WHEN 偵測 Gemini CLI，THEN 檢查 `~/.gemini` 目錄是否存在
- WHEN 偵測 Copilot CLI，THEN 檢查 `~/.copilot` 目錄是否存在
- WHEN 偵測 Codex CLI，THEN 檢查 `~/.codex` 目錄是否存在

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-003: 生成 Claude Code CLAUDE.md

在專案根目錄生成精簡的 CLAUDE.md，含 AI Knowledge 位置指引和 Constitution 參考。

**場景：**
- WHEN agent sync 執行，THEN CLAUDE.md 生成在專案根目錄
- WHEN 檢查 CLAUDE.md 內容，THEN 包含 Knowledge 路徑和可用 Skills 清單
- WHEN CLAUDE.md 不超過 100 行，THEN 不使用 @import（避免 token 浪費）

**新增來源**: mvp-initial (2026-02-04)

### Skill 生成與管理

### REQ-AGNT-004: 生成 SDD Skills

為 AI agent 生成 Skill 檔案，遵循 SDD 工作流程。

**場景：**
- WHEN agent sync 執行，THEN 從 .hbs 模板生成 Skill 檔案
- WHEN 部署到 Claude，THEN 每個 Skill 一個目錄含 SKILL.md + references/
- WHEN 部署到 Copilot，THEN 使用 .instructions.md 格式（inline references）

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-005: Skill 引導 Progressive Disclosure

每個 SKILL.md 引導 AI 按需讀取 AI Knowledge（先讀 `_index.md`，再讀相關模組）。

**場景：**
- WHEN Skill 被觸發（如 `/prospec-plan`），THEN AI 先讀 `_index.md` 索引
- WHEN 識別到相關模組，THEN 再載入 `modules/{module}/README.md`
- WHEN 需要更深資訊，THEN 讀取原始碼（Layer 3）

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-006: 指定特定 CLI

使用者可透過 `--cli` 參數指定特定 CLI。

**場景：**
- WHEN 指定 `--cli claude`，THEN 只生成 Claude Code 相關配置
- WHEN 未指定 `--cli`，THEN 處理所有偵測到的 CLI

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-007: 原子寫入策略

使用原子寫入策略（暫存檔 → 重命名），寫入失敗時保留原檔案。

**場景：**
- WHEN 寫入成功，THEN 暫存檔重命名為目標檔案
- WHEN 寫入失敗（磁碟不足、權限不足），THEN 保留原檔案並報錯

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-008: 冪等更新

配置檔已存在時更新而非重複建立。

**場景：**
- WHEN CLAUDE.md 已存在，THEN 更新內容而非建立新檔案
- WHEN Skill 目錄已存在，THEN 更新 SKILL.md 而非重建目錄

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-009: Skill 命名慣例

Skill 命名遵循 `prospec-*` 慣例。

**場景：**
- WHEN 新 Skill 被建立，THEN 名稱格式為 `prospec-{name}`
- WHEN 部署到 .claude/skills/，THEN 目錄名稱為 `prospec-{name}`

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-010: 三層 Progressive Disclosure

Skill 採用三層設計控制 token 消耗。

**場景：**
- WHEN Layer 1（name + description），THEN 約 100 tokens
- WHEN Layer 2（SKILL.md body），THEN 不超過 500 行
- WHEN Layer 3（references/ 按需讀取），THEN 只在 Skill 內需要時載入

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-011: 模板為唯一來源

Skill 模板從 `src/templates/skills/*.hbs` 生成（Single Source of Truth），注入專案 context。

**場景：**
- WHEN agent sync 執行，THEN 從 .hbs 模板 render 出最終 Skill 檔案
- WHEN 模板更新後重新 sync，THEN 部署的 Skill 反映最新模板

**新增來源**: mvp-initial (2026-02-04)

### REQ-AGNT-012: Planning Skills 呼叫 CLI

Planning 類 Skills 呼叫對應的 CLI 命令建立骨架，再由 AI 填充內容。

**場景：**
- WHEN `/prospec-new-story` 觸發，THEN AI 自行建立 change 目錄和骨架檔案
- WHEN `/prospec-ff` 觸發，THEN AI 依序完成 story → plan → tasks 三步驟

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: skill-autonomy (2026-02-04) — Skills 自行建立骨架，不再呼叫 CLI

### Skill Definitions

### REQ-TYPES-011: Skill 定義常數

在 SKILL_DEFINITIONS 常數中定義所有可用 Skills。

**場景：**
- WHEN 新 Skill 被新增，THEN SKILL_DEFINITIONS 被更新
- WHEN agent sync 執行，THEN 為所有定義的 Skills 生成檔案
- WHEN prospec-design Skill 存在，THEN SKILL_DEFINITIONS 包含 name: 'prospec-design'、type: 'Planning'、hasReferences: true

**新增來源**: add-archive-system (2026-02-09)
**修改來源**: add-design-phase (2026-02-16) — 新增 prospec-design 到 SKILL_DEFINITIONS

### REQ-AGNT-013: Skill Reference 映射

`getSkillReferences()` 定義每個 Skill 的 reference 檔案映射，agent sync 依此生成 references/ 目錄。

**場景：**
- WHEN agent sync 執行 prospec-design，THEN 生成 6 個 reference 檔案（design-spec-format、interaction-spec-format、adapter-pencil、adapter-figma、adapter-penpot、adapter-html）
- WHEN reference 映射新增，THEN `.claude/skills/prospec-design/references/` 下有對應 .md 檔案

**新增來源**: add-design-phase (2026-02-16)

### Skill 語言中立

### REQ-SKILL-009: Skill 產出語言中立

SKILL.md 不包含任何硬編碼的輸出語言指令。產出語言由專案的 Constitution、CLAUDE.md 或使用者偏好決定。

**場景：**
- WHEN agent sync 從 .hbs 模板生成 SKILL.md，THEN SKILL.md 不包含 `All generated files must be written in English` 或類似語言強制指令
- WHEN 使用者在 Constitution 規定繁體中文，THEN Skill 觸發後的產出語言遵循 Constitution
- WHEN 無語言規定時，THEN AI 根據對話上下文自行判斷語言

**新增來源**: remove-skill-language-directives (2026-03-01)

### REQ-SKILL-010: Activation 語言中立

SKILL.md 的 Activation 區段使用 `When triggered, briefly describe:` 格式，不指定回應語言。

**場景：**
- WHEN Skill 被觸發，THEN Activation 指引為 `When triggered, briefly describe:`（無語言指定）
- WHEN AI 執行 Activation，THEN 回應語言由外部機制（CLAUDE.md、Constitution、對話上下文）決定

**新增來源**: remove-skill-language-directives (2026-03-01)

## 邊界案例

- 沒有偵測到任何已安裝的 AI CLI：列出支援的 CLI 並提示安裝方式
- 寫入失敗（磁碟空間不足、權限不足）：使用原子寫入，失敗時保留原檔案
- Planning Skill 觸發時 Constitution 不存在：跳過 Constitution Check，不阻擋工作流

## 成功指標

- **SC-001**: `prospec agent sync` 為所有偵測到的 agent 生成正確配置
- **SC-002**: 部署的 Skills 與 source .hbs 模板一致
- **SC-005**: AI Knowledge 節省 70% 以上的 token 使用量

## 變更歷史

| 日期 | 變更 | 影響 | REQs |
|------|------|------|------|
| 2026-02-04 | mvp-initial | 建立 agent sync 工作流，支援 4 個 agent | REQ-AGNT-001~012 |
| 2026-02-04 | skill-autonomy | Skills 自行建立骨架不再呼叫 CLI | REQ-AGNT-012 |
| 2026-02-09 | add-archive-system | 新增 archive skill 到 definitions | REQ-TYPES-011 |
| 2026-02-09 | add-knowledge-update | 新增 knowledge-update skill | REQ-TYPES-011 |
| 2026-02-16 | add-design-phase | 新增 prospec-design Skill 定義和 6 個 reference 映射 | REQ-TYPES-011, REQ-AGNT-013 |
| 2026-03-01 | remove-skill-language-directives | Skills 語言中立化，移除硬編碼語言指令 | REQ-SKILL-009, REQ-SKILL-010 |
