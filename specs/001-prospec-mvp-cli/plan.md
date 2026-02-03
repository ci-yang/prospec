> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# Implementation Plan: Prospec MVP CLI

**Branch**: `001-prospec-mvp-cli` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-prospec-mvp-cli/spec.md`

## Summary

Prospec MVP CLI 是一套漸進式規格驅動開發（SDD）工具。設計理念為 **CLI 做管理，Skills 做開發**：CLI 命令負責基礎設施（init、steering、knowledge、agent sync）和變更管理骨架（change story/plan/tasks），而 SDD 工作流程透過獨立的 `prospec-*` Skills 驅動 AI Agent。

技術方案採用 **Pragmatic Layered Architecture**（務實分層架構），基於 CLI 開發最佳實踐研究，以 `cli/ → services/ → lib/ → types/` 四層取代 Clean Architecture 的 Port/Adapter 模式。

## Technical Context

**Language/Version**: TypeScript 5.9.3 + Node.js 24 LTS (Krypton) / Bun 1.3.7 雙相容
**Primary Dependencies**: Commander.js 14.0.2, Zod 4.3.5, @inquirer/prompts 8.2.0, yaml 2.x, fast-glob 3.3.3, picocolors 1.1.1, Handlebars 4.7.8
**Storage**: 檔案系統（.prospec.yaml, YAML, Markdown）
**Testing**: Vitest 4.0.17 + memfs
**Target Platform**: macOS / Linux CLI（Node.js 20+ 或 Bun）
**Project Type**: Single CLI project
**Performance Goals**: init < 3s, steering < 30s（500 檔案以下）, knowledge generate < 60s
**Constraints**: 無網路需求、原子寫入、CLI 模式需支援 CI/CD（`--quiet`, `--agents`）
**Scale/Scope**: 單一 CLI 工具，7 個 CLI 命令 + 7 個 SDD Skills，4 AI Agents

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. Progressive Disclosure First | ✅ PASS | 三層 Skill 架構（metadata → SKILL.md body → references）+ 二層 AI Knowledge（`_index.md` → `modules/{m}/README.md`） |
| II. Spec is Source of Truth | ✅ PASS | 變更管理 Skills（story → plan → tasks）確保規格先行；`docs/specs/` 累積已完成的 Main Spec |
| III. Zero Startup Cost for Brownfield | ✅ PASS | `prospec steering` 自動掃描現有專案，無需預先文件化 |
| IV. AI Agent Agnostic | ✅ PASS | MVP 支援 4 種 AI CLI（Claude Code、Gemini CLI、GitHub Copilot、Codex CLI），Skill 格式適配各平台 |
| V. User Controls the Rules | ✅ PASS | `docs/CONSTITUTION.md` 由使用者定義；content marker 保護使用者區域 |
| VI. Language Policy | ✅ PASS | 文件用繁體中文，程式碼用英文 |

## 設計傳承

Prospec 集各家 SDD 方法論之優點，以下標明每個核心設計的來源與 Prospec 的改進：

| 設計特性 | 來源 | Prospec 改進 |
|----------|------|-------------|
| **Constitution 驗證** | Spec-Kit | 從「人工檢查」升級為「每階段自動驗證 + 阻擋」 |
| **Delta Specs** | OpenSpec | 保留 ADDED/MODIFIED/REMOVED 格式，加入自動 Sync 到 Main Spec |
| **Fast-Forward** | OpenSpec `/opsx:ff` | 從「AI 一次性生成」改為「CLI 建骨架 + AI 填內容」分離模式 |
| **Archive 歸檔** | OpenSpec | 保留完整歷程歸檔，Phase 2 加入自動 Knowledge Update |
| **Scale-Adaptive** | BMAD 5 級（按專案複雜度分） | 轉換為按「變更流程深度」分的 Quick/Standard/Full 3 級（Phase 2） |
| **Steering 架構分析** | cc-sdd `/kiro:steering`（含 Design Principles + Product Requirements） | 刻意縮小範圍：只保留架構分析並升級為 CLI 命令，Design Principles 由 Constitution 負責，Product Requirements 由 change story 負責 |
| **Template 自訂** | cc-sdd `.kiro/settings/templates/` | Handlebars 模板集中管理（`src/templates/`），`agent sync` 統一生成 |
| **Multi-Agent** | cc-sdd 8 Agent | 保留多 Agent 支援，加入 Universal Core + CLI Adapters 架構 |
| **漸進式揭露** | Prospec 原創 | 三層 Progressive Disclosure（metadata → body → references），Token 省 70-80% |
| **CLI + Skills 分離** | Prospec 原創 | CLI 做確定性管理，Skills 做 AI 引導 — 其他工具都是 Skill-only |
| **Content Markers** | Prospec 原創 | `<!-- prospec:auto/user-start/end -->` 保護使用者自訂區域 |
| **AI Knowledge** | Prospec 原創 | `_index.md` 按需索引 + 模組化 Knowledge，非全量載入 |

> **Prospec 的核心差異化**：其他 SDD 工具是 「Skill-only」（所有操作都在 AI 對話中完成），Prospec 是「CLI + Skills 混合」— CLI 命令提供確定性的基礎設施操作和檔案骨架，Skills 引導 AI 填充智慧內容。這使得 CLI 可獨立用於 CI/CD，Skills 可適配任何 AI Agent。

## 設計理念

### CLI + Skills 混合模式（Prospec 原創）

參考 [prospec-design.md](../../docs/prospec-design.md) 的核心設計：

> **CLI 做管理，Skills 做開發。**

- **CLI**：專案初始化、Knowledge 生成、架構分析、Agent 配置同步、變更骨架建立 — 確定性的工具操作
- **Skills**：日常開發流程（story → plan → tasks → implement → verify） — AI Agent 的工作流程指引

其他 SDD 工具（OpenSpec、cc-sdd、BMAD）的所有操作都在 AI 對話中完成（Skill-only），Prospec 是唯一將「確定性操作」和「AI 引導」明確分離的工具。

### 命令 vs Skills 職責劃分

| 類別 | 實現方式 | 負責範圍 |
|------|---------|---------|
| **基礎設施** | CLI 命令（`prospec init/steering/knowledge/agent`） | 檔案生成、目錄建立、掃描分析、配置同步 |
| **變更骨架** | CLI 命令（`prospec change story/plan/tasks`） | 建立結構化的骨架檔案（確定性，CI/CD 可用） |
| **SDD 工作流** | AI Agent Skills（`prospec-*`） | 引導 AI 執行結構化的變更管理流程，填充骨架內容 |

### Universal Core + CLI Adapters

參考 design.md 的多 Agent 策略：

```
Universal Core（CLI 無關）
├── docs/ai-knowledge/          ← 所有 CLI 都能讀 Markdown
├── docs/CONSTITUTION.md        ← 通用規則
└── docs/specs/                 ← 通用規格（Main Specs 累積）

CLI Adapters（格式轉換）
├── Claude Code → CLAUDE.md + .claude/skills/prospec-*/
├── Gemini CLI  → GEMINI.md + .gemini/skills/prospec-*/
├── Codex CLI   → AGENTS.md + .codex/skills/prospec-*/
└── Copilot     → .github/copilot-instructions.md + .github/instructions/prospec-*.instructions.md
```

**Agent 配置是衍生物**，可隨時透過 `prospec agent sync` 重新生成。

### Scale Adapter（Phase 2 規劃）

設計預留 Quick/Standard/Full 三級複雜度適配，MVP 先支援 Standard 流程：

| Flow | 使用時機 | MVP 狀態 |
|------|---------|---------|
| **Quick** | Bug fix、小調整 | Phase 2 |
| **Standard** | 一般功能開發 | ✅ MVP |
| **Full** | 大型功能、跨模組 | Phase 2 |

## Architecture Design

### Decision: Pragmatic Layered Architecture

基於 CLI 開發最佳實踐研究（參考 OpenSpec、ESLint、Turborepo、Changesets），**放棄 Clean Architecture 的 Port/Adapter 模式**，採用業界主流的務實分層架構。

#### 為什麼不用 Clean Architecture？

| 考量 | Clean Architecture | Pragmatic Layered |
|------|-------------------|-------------------|
| **業界實踐** | 無主流 TypeScript CLI 使用 | OpenSpec、ESLint、Changesets 均採用 |
| **Port/Adapter 價值** | 多入口場景有用（REST + GraphQL + CLI） | CLI 只有單一入口，interface 是多餘抽象 |
| **前期成本** | 每個 fs 操作需 interface + implementation | 直接封裝，90% 可測試性，10% 複雜度 |
| **命令數量** | 適合 20+ commands 的大型 CLI | 7 個命令不需要這層抽象 |
| **測試方式** | 透過 Port mock | 透過 memfs mock lib 層同樣有效 |

#### 架構圖

```
┌──────────────────────────────────────────────────────┐
│  CLI Layer (src/cli/)                                │
│  ┌─────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │commands/ │  │formatters/│  │index.ts           │  │
│  │         │  │           │  │(Commander.js setup)│  │
│  └────┬────┘  └─────┬─────┘  └────────┬──────────┘  │
│       │             │                 │              │
│  解析參數 ──→ 呼叫 service ──→ 格式化輸出              │
└──────┬───────────────────────────────────────────────┘
       │ 只依賴 services/ 和 types/
       ▼
┌──────────────────────────────────────────────────────┐
│  Services Layer (src/services/)                      │
│  ┌───────────────────────────────────────────────┐   │
│  │ init.service.ts     steering.service.ts       │   │
│  │ knowledge.service.ts  agent-sync.service.ts   │   │
│  │ change-story.service.ts  change-plan.service.ts│  │
│  │ change-tasks.service.ts                       │   │
│  └───────────────────────────┬───────────────────┘   │
│              每個 service 對應一個命令                  │
│              包含完整的業務邏輯                         │
└──────┬───────────────────────────────────────────────┘
       │ 只依賴 lib/ 和 types/
       ▼
┌──────────────────────────────────────────────────────┐
│  Lib Layer (src/lib/)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │config.ts │ │fs-utils.ts│ │scanner.ts│             │
│  │yaml-utils│ │detector  │ │template  │             │
│  │logger    │ │module-det│ │content-m │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│  無狀態純函數，可獨立測試                               │
└──────┬───────────────────────────────────────────────┘
       │ 只依賴 types/
       ▼
┌──────────────────────────────────────────────────────┐
│  Types Layer (src/types/)                            │
│  config.ts │ module-map.ts │ change.ts │ errors.ts   │
│  無任何依賴                                           │
└──────────────────────────────────────────────────────┘
```

#### 層次約束規則（借鑑 ESLint）

| Layer | 可存取 | 不可存取 | 原因 |
|-------|--------|---------|------|
| `cli/` | `services/`, `types/` | `lib/` | CLI 不應直接操作檔案系統，透過 service 層調度 |
| `services/` | `lib/`, `types/` | `cli/` | 業務邏輯不依賴 CLI 框架，可獨立測試 |
| `lib/` | `types/`, Node.js built-in | `cli/`, `services/` | 純工具函數，無業務知識 |
| `types/` | 無 | 所有其他層 | 零依賴型別定義 |

### 設計模式

#### Command Handler Pattern

每個 CLI 命令遵循統一模式：

```typescript
// src/cli/commands/init.ts
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .option('--name <name>', '專案名稱')
    .option('--agents <list>', 'AI agents (comma-separated)')
    .action(async (options) => {
      const result = await initService.execute(options);
      formatInitOutput(result);
    });
}
```

#### Service Pattern

每個 service 封裝完整的業務邏輯：

```typescript
// src/services/init.service.ts
export async function execute(options: InitOptions): Promise<InitResult> {
  // 1. 檢查前置條件（configExists?）
  // 2. 偵測技術棧（detectTechStack）
  // 3. 互動選擇 agents（promptAgentSelection）
  // 4. 寫入檔案（writeConfig, createDirs, renderTemplates）
  // 5. 回傳結果
}
```

#### Formatter Pattern

分離顯示邏輯，便於測試和未來擴展：

```typescript
// src/cli/formatters/init-output.ts
export function formatInitOutput(result: InitResult, options: FormatOptions): void {
  if (options.quiet) return;
  // 格式化 + 色彩 + verbose 支援
}
```

### Commander.js 14 整合模式（Context7 驗證）

```typescript
// src/cli/index.ts
const program = new Command();

program
  .name('prospec')
  .version(version)
  .configureOutput({
    writeOut: (str) => process.stdout.write(str),
    writeErr: (str) => process.stderr.write(str),
  })
  .exitOverride(); // 測試時拋出 CommanderError 而非 process.exit()

// preAction hook：統一前置條件檢查
program.hook('preAction', (thisCommand) => {
  if (needsConfig(thisCommand) && !configExists()) {
    throw new PrerequisiteError('prospec init');
  }
});
```

### CLI 標準合規

#### NO_COLOR 支援

picocolors 已內建 NO_COLOR 支援。優先順序：
1. `--no-color` / `--color` CLI flag（最高）
2. `FORCE_COLOR` 環境變數
3. `NO_COLOR` 環境變數
4. TTY 偵測 `process.stdout.isTTY`

#### Exit Codes

遵循 POSIX 簡潔慣例：
- `0`：成功
- `1`：一般錯誤（業務邏輯失敗）
- `2`：使用方式錯誤（Commander.js 預設）

使用 `process.exitCode = n` 取代 `process.exit(n)`，確保 stdout 完整 flush。

#### TTY 偵測

- `process.stdout.isTTY` 為 false 時：停用色彩、停用 spinner、使用 machine-readable 輸出
- `--quiet` 模式停用所有裝飾性輸出

### 錯誤處理策略

```typescript
// src/types/errors.ts
export class ProspecError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestion: string
  ) { super(message); }
}

// CLI 層統一捕獲
try {
  await program.parseAsync();
} catch (err) {
  if (err instanceof ProspecError) {
    formatError(err); // 顯示 message + suggestion
    process.exitCode = 1;
  }
}
```

## Prospec Skills 設計

### 設計原則

Prospec Skills 的設計融合了四家工具的最佳實踐，並加入 Prospec 原創特性：

1. **Constitution 驗證貫穿全程**（← Spec-Kit）：不只在 verify 階段，而是 story/plan/tasks 每階段都執行 Constitution **快速檢查**（spot check — 比對與當前 artifact 最相關的 Constitution 原則），及早發現明顯遺漏；verify 階段執行**完整驗證**（full audit — 逐條比對所有原則）
2. **CLI 建骨架 + AI 填內容**（← Prospec 原創）：與 OpenSpec 的「AI 一次性生成全部」不同，Prospec 的 Planning Skills 先呼叫 CLI 命令建立確定性的檔案結構，再由 AI 填充智慧內容
3. **漸進式 Context 載入**（← Prospec 原創）：先讀 `_index.md` 索引（~200 tokens），再按需載入相關模組 Knowledge — 不一次載入所有專案文件
4. **Template 驅動一致性**（← cc-sdd）：所有 Skill 從 Handlebars 模板生成，確保跨 AI Agent 的行為一致

### Skills 完整清單

每個 Skill 是一個獨立、可組合的工作流步驟：

| Skill 名稱 | Type | CLI 依賴 | MVP | 來源啟發 | 說明 |
|------------|------|---------|:---:|---------|------|
| `prospec-explore` | Lifecycle | 無 | ✅ | BMAD Analyst | 探索模式：思考夥伴，釐清需求、調查問題、比較方案 |
| `prospec-new-story` | Planning | `prospec change story` | ✅ | OpenSpec + Spec-Kit | 建立變更需求（CLI 骨架 + AI 填充 + Constitution 檢查） |
| `prospec-plan` | Planning | `prospec change plan` | ✅ | OpenSpec + cc-sdd | 生成實作計劃（CLI 骨架 + AI 填充 + Constitution 檢查） |
| `prospec-tasks` | Planning | `prospec change tasks` | ✅ | Spec-Kit + cc-sdd | 拆分任務清單（CLI 骨架 + AI 填充 + 並行標記） |
| `prospec-ff` | Planning | `story + plan + tasks` | ✅ | OpenSpec ff + 原創 | 快速前進：CLI 命令序列 + AI 逐步填充（非一次性生成） |
| `prospec-implement` | Execution | 無（純 AI） | ✅ | OpenSpec apply | 實作任務：按 tasks.md 逐項實作，更新狀態 |
| `prospec-verify` | Execution | 無（純 AI） | ✅ | OpenSpec + Spec-Kit | 驗證實作：Constitution 完整驗證 + Spec 一致性 + 測試 |
| `prospec-archive` | Lifecycle | `prospec change history` | Phase 2 | OpenSpec archive + 原創 | 歸檔完成的變更 + 自動 Knowledge Update |

**Skill Type 說明**：
- **Planning**: 依賴 CLI 命令建立骨架 → AI 填充內容（確定性 + 智慧的分離）— **每階段含 Constitution 檢查**
- **Execution**: 純 AI 工作流，無 CLI 基礎命令
- **Lifecycle**: 輔助工具（explore 無 CLI 依賴；archive 依賴 Phase 2 CLI）

### Skill 詳細設計

#### `prospec-explore`（← BMAD Analyst 角色啟發）

```yaml
---
name: prospec-explore
description: |
  探索模式 — 作為思考夥伴，協助釐清需求、調查問題、比較方案。
  觸發詞：探索、釐清、調查、比較、分析問題、思考。
  此模式僅用於思考，不寫程式碼。
---
```

**行為**：
- 讀取 `docs/ai-knowledge/_index.md` 了解專案模組（漸進式載入，不一次載入全部）
- 讀取 `docs/CONSTITUTION.md` 了解專案規則
- 以好奇、開放的態度引導使用者探索（借鑑 BMAD Analyst 的需求挖掘方式）
- 使用 ASCII 圖表視覺化思考
- 探索結束後建議 `/prospec-new-story` 或 `/prospec-ff`

**與 BMAD 差異**：BMAD 需要獨立的 Analyst Agent 對話；Prospec 在同一對話中完成，無角色切換成本。

#### `prospec-new-story`（← OpenSpec story + Spec-Kit Constitution）

```yaml
---
name: prospec-new-story
description: |
  建立新的變更需求。引導使用者描述需求，呼叫 prospec change story 建立結構化的
  proposal.md 和 metadata.yaml。觸發詞：新功能、變更、story、需求。
---
```

**行為**：
1. 詢問使用者想建立什麼（如未提供）
2. 從描述導出 kebab-case 名稱
3. 執行 `prospec change story <name> --description "<desc>"`（CLI 建骨架）
4. 讀取生成的 `proposal.md` 模板
5. 引導使用者填充 User Story 格式（As a / I want / So that）和驗收標準
6. **Constitution 檢查**（← Spec-Kit）：讀取 `docs/CONSTITUTION.md`，比對 story 內容是否遺漏必要的非功能需求（如安全性、效能限制）。若有疑慮，以警告形式提示使用者
7. 顯示相關模組（從 `_index.md` 關鍵字匹配 — 漸進式揭露）
8. 提示下一步：`/prospec-plan` 或 `/prospec-ff`

**與 OpenSpec 差異**：OpenSpec 的 `/opsx:story` 由 AI 直接生成完整 story；Prospec 先用 CLI 建骨架（確定性），再由 AI 引導使用者互動填充（智慧）。加入 Constitution 檢查是 OpenSpec 沒有的品質防護。

#### `prospec-plan`（← OpenSpec design + cc-sdd steering + Spec-Kit Constitution）

```yaml
---
name: prospec-plan
description: |
  基於變更需求生成實作計劃。讀取 proposal.md、相關模組的 AI Knowledge 和
  Constitution，產出結構化的 plan.md 和 delta-spec.md。
  觸發詞：計劃、plan、實作方案、設計。
---
```

**行為**：
1. 解析當前 change（自動偵測或提示指定）
2. 讀取 `proposal.md` 取得需求
3. 讀取 `docs/ai-knowledge/_index.md` 識別相關模組（漸進式揭露 Layer 1）
4. 按需載入 `modules/{module}/README.md`（漸進式揭露 Layer 2 — 只載入相關模組）
5. 讀取 `docs/CONSTITUTION.md` 作為設計約束
6. 執行 `prospec change plan [--change <name>]` 生成骨架（CLI 確定性操作）
7. AI 根據 context 填充計劃細節（概述、受影響模組、實作步驟、風險考量）
8. **Constitution 檢查**（← Spec-Kit）：驗證計劃是否違反 Constitution 原則（如架構分層、測試要求），違反則警告並建議修正
9. 生成 `delta-spec.md`（ADDED/MODIFIED/REMOVED 格式 ← OpenSpec Delta Specs）
10. 提示下一步：`/prospec-tasks`

**與 OpenSpec 差異**：OpenSpec 的 `/opsx:design` 生成設計文件但不做 Constitution 驗證；Prospec 在計劃階段就攔截架構違規。此外，Prospec 使用漸進式 Context 載入（~3,500 tokens vs OpenSpec 載入全部 project.md）。

**與 cc-sdd 差異**：cc-sdd 的 `/kiro:spec-design` 產出 Mermaid 圖表；Prospec 產出 delta-spec.md（變更導向），更適合 Brownfield 專案。

#### `prospec-tasks`（← Spec-Kit 結構化任務 + cc-sdd 並行標記）

```yaml
---
name: prospec-tasks
description: |
  將實作計劃拆分為可執行的任務清單。按架構層次排序，使用 checkbox 格式，
  含複雜度估算和並行標記。觸發詞：任務、tasks、拆分、工作項目。
---
```

**行為**：
1. 解析當前 change
2. 讀取 `plan.md` 取得計劃
3. 執行 `prospec change tasks [--change <name>]` 生成骨架（CLI 確定性操作）
4. AI 按架構層次填充任務（Models → Services → Routes → Tests）
5. 每個任務含 `- [ ]` checkbox、具體描述、`~{lines} lines` 估算
6. 標記可並行的任務為 `[P]`（← Spec-Kit 並行標記 + cc-sdd 依賴圖概念）
7. **Constitution 檢查**（← Spec-Kit）：確認任務清單包含必要的測試任務（若 Constitution 要求 TDD），遺漏則警告
8. 產出摘要：總任務數、可並行數、總估算行數
9. 提示下一步：`/prospec-implement`

**與 Spec-Kit 差異**：Spec-Kit 產出 46 個細粒度任務可能過於繁瑣；Prospec 以中等粒度（~15-25 個）為目標，並用 `[P]` 標記支援並行開發。**粒度控制機制**：若任務超過 25 個，合併同一架構層內的相關小任務；若少於 10 個，考慮拆分大任務（Skill template 會包含此粒度約束提示）。

**與 cc-sdd 差異**：cc-sdd 使用依賴圖結構；Prospec 使用更簡潔的架構層次排序 + 並行標記，降低認知負擔。

#### `prospec-ff`（← OpenSpec `/opsx:ff` 啟發，Prospec 重新設計）

```yaml
---
name: prospec-ff
description: |
  快速前進 — 一次生成所有 planning artifacts（story → plan → tasks）。
  適合需求明確時快速推進。觸發詞：快速、ff、一次到位、全部生成。
---
```

**行為**（使用 CLI 命令序列，不依賴其他 Skills）：
1. 詢問使用者想建立什麼（如未提供），導出 kebab-case 名稱
2. 讀取 `docs/ai-knowledge/_index.md` 和 `docs/CONSTITUTION.md`
3. **Step 1 - Story**（CLI 骨架 + AI 填充）：
   - 執行 `prospec change story <name> --description "<desc>"`
   - 讀取生成的 `proposal.md` 骨架
   - 填充 User Story（As a / I want / So that）和驗收標準
   - **Constitution 快速檢查**：比對 story 是否遺漏必要需求
4. **Step 2 - Plan**（CLI 骨架 + AI 填充）：
   - 執行 `prospec change plan --change <name>`
   - 按需載入相關模組 `modules/{module}/README.md`（漸進式揭露）
   - 填充計劃細節（概述、受影響模組、實作步驟、風險考量）
   - 填充 `delta-spec.md`（Delta Specs 格式）
   - **Constitution 快速檢查**：驗證計劃不違反架構原則
5. **Step 3 - Tasks**（CLI 骨架 + AI 填充）：
   - 執行 `prospec change tasks --change <name>`
   - 按架構層次填充任務、複雜度估算、並行標記
   - **Constitution 快速檢查**：確認包含必要測試任務
6. 顯示完整摘要（所有 artifacts + Constitution 檢查結果）
7. 若任一步驟失敗，保留已完成的步驟（漸進式原則），提示使用者用對應 Skill 繼續
8. 提示下一步：`/prospec-implement`

**與 OpenSpec `/opsx:ff` 的關鍵差異**：

| 面向 | OpenSpec `/opsx:ff` | Prospec `/prospec-ff` |
|------|---------------------|----------------------|
| **生成方式** | AI 一次性生成所有文件 | CLI 逐步建骨架 + AI 逐步填充 |
| **品質驗證** | 無中間檢查 | 每步 Constitution 快速檢查 |
| **失敗恢復** | 全部重來 | 保留已完成步驟，從失敗點繼續 |
| **Context 載入** | 載入全部 project.md | 漸進式按需載入相關模組 |
| **可追溯性** | 單一 AI 對話 | 每步有獨立的 CLI 產出檔案 |

**設計決策**：`prospec-ff` 直接內聯完整工作流指引和 CLI 命令序列，不依賴其他 Skill 的觸發。這避免了 Skill 間耦合，確保跨 AI CLI 平台的行為一致性（部分 AI CLI 不支援 slash command chaining）。

**失敗恢復策略**（← Prospec 原創，OpenSpec 無此機制）：若 `prospec-ff` 在中間步驟失敗：
- `metadata.yaml` 的 status 停留在最後成功的狀態（如 plan 步驟失敗則停留在 `story`）
- 已生成的檔案（如 `proposal.md`）保持完整可用
- 使用者可用對應的單一 Skill（`/prospec-plan` 或 `/prospec-tasks`）從失敗點繼續

#### `prospec-implement`（← OpenSpec apply + Spec-Kit TDD）

```yaml
---
name: prospec-implement
description: |
  按 tasks.md 逐項實作任務。讀取任務清單，按順序實作，完成後勾選 checkbox。
  觸發詞：實作、implement、開始寫程式、coding。
---
```

**行為**：
1. 讀取 `tasks.md` 取得任務清單
2. 找到第一個未完成的任務（`- [ ]`）
3. 讀取相關模組的 AI Knowledge（漸進式揭露 — 只載入當前任務涉及的模組）
4. 讀取 `plan.md` 和 `delta-spec.md` 確認設計
5. 實作任務（寫程式碼、寫測試 — 若 Constitution 要求 TDD 則先寫測試）
6. 完成後將 `- [ ]` 更新為 `- [x]`
7. 繼續下一個任務，或等待使用者指示
8. 全部完成後提示：`/prospec-verify`

**與 OpenSpec 差異**：OpenSpec 的 `/opsx:apply` 一次實作所有任務；Prospec 逐項實作，每個任務有明確的完成標記，便於中斷恢復和進度追蹤。

#### `prospec-verify`（← OpenSpec verify + Spec-Kit Constitution 完整驗證）

```yaml
---
name: prospec-verify
description: |
  驗證實作是否符合規格和計劃。執行 Constitution 完整驗證、tasks.md 完成度、
  spec 一致性、測試通過率。觸發詞：驗證、verify、檢查、review。
---
```

**行為**：
1. 讀取 `tasks.md` 確認所有任務已完成
2. 讀取 `delta-spec.md` 比對實際實作
3. **Constitution 完整驗證**（← Spec-Kit，此處為深度驗證而非快速檢查）：
   - 逐條比對 `docs/CONSTITUTION.md` 的每個原則
   - 產出 Constitution Compliance Report（PASS/WARN/FAIL）
   - FAIL 項目必須修正後才能視為完成
4. 執行測試（`npm test` / `bun test`）
5. 報告驗證結果：
   - 任務完成率（x/y tasks）
   - Constitution 合規（所有原則 PASS/WARN/FAIL）
   - Delta Spec 一致性（ADDED/MODIFIED 項目都已實作）
   - 測試通過率
6. 若有遺漏，建議修正方式
7. 全部通過後提示：完成歸檔（Phase 2 可用 `/prospec-archive`）

**與 OpenSpec 差異**：OpenSpec 的 verify 偏重格式檢查（Requirements Coverage, Scenario Coverage）；Prospec 加入 Constitution 深度驗證，從使用者定義的原則層面檢查品質。

**Constitution 驗證層次**：

| 面向 | 快速檢查（spot check） | 完整驗證（full audit） |
|------|----------------------|---------------------|
| **使用階段** | story / plan / tasks / ff | verify |
| **範圍** | 只比對與當前 artifact 直接相關的 Constitution 原則（最少 3 條） | 逐條比對所有 Constitution 原則 |
| **產出** | 行內警告（warning in Skill output） | 獨立的 Constitution Compliance Report（PASS/WARN/FAIL） |
| **阻擋** | 不阻擋流程，僅警告 | FAIL 項目必須修正後才能視為完成 |
| **觸發** | Skill 自動執行 | Skill 自動執行 |

### Skill 生成機制

`prospec agent sync` 負責將上述 Skills 生成到各 AI CLI 的 skills 目錄：

```text
prospec agent sync
    ├── 讀取 .prospec.yaml（agents 設定）
    ├── 讀取 src/templates/skills/*.hbs（Skill 模板）
    ├── 注入專案 context（tech_stack, knowledge path, constitution path）
    ↓
    依 agents 設定生成（MVP 7 個 Skills，不含 archive）：
    ├── Claude Code → .claude/skills/prospec-*/SKILL.md
    ├── Gemini CLI → .gemini/skills/prospec-*/SKILL.md
    ├── Codex CLI → .codex/skills/prospec-*/SKILL.md
    └── GitHub Copilot → .github/instructions/prospec-*.instructions.md
```

### Skill 目錄結構（以 Claude Code 為例）

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

> 注意：`prospec-archive` Skill 為 Phase 2，MVP 不生成。

### 多 Agent 支援策略

| AI CLI | Skill 位置 | 入口配置檔 | 格式特性 |
|--------|-----------|-----------|---------|
| Claude Code | `.claude/skills/prospec-*/SKILL.md` | `CLAUDE.md` | YAML frontmatter + Markdown，支援 references/ |
| Gemini CLI | `.gemini/skills/prospec-*/SKILL.md` | `GEMINI.md` | 同 Claude Code 格式 |
| Codex CLI | `.codex/skills/prospec-*/SKILL.md` | `AGENTS.md` | 同 Claude Code 格式 |
| GitHub Copilot | `.github/instructions/prospec-*.instructions.md` | `.github/copilot-instructions.md` | YAML `applyTo` frontmatter + Markdown（單檔，reference 內容 inline） |

**核心內容 Single Source of Truth**：所有 Skill 從 `src/templates/skills/*.hbs` 生成，只有外層格式和位置根據 AI CLI 調整。

## Project Structure

### Documentation (this feature)

```text
specs/001-prospec-mvp-cli/
├── plan.md              # 本文件
├── research.md          # Phase 0 技術研究報告
├── data-model.md        # Phase 1 資料模型定義
├── quickstart.md        # Phase 1 快速上手指南
├── contracts/           # Phase 1 契約定義
│   └── cli-commands.md  # CLI 命令契約
└── tasks.md             # Phase 2 任務清單
```

### Source Code (repository root)

```text
src/
├── cli/                           # Layer 1: CLI 入口
│   ├── index.ts                   # Commander.js program 定義 + global options
│   ├── commands/                  # 每個命令一個檔案
│   │   ├── init.ts
│   │   ├── steering.ts
│   │   ├── knowledge-generate.ts
│   │   ├── agent-sync.ts
│   │   ├── change-story.ts
│   │   ├── change-plan.ts
│   │   └── change-tasks.ts
│   └── formatters/                # 輸出格式化（分離顯示邏輯）
│       ├── init-output.ts
│       ├── steering-output.ts
│       └── error-output.ts
│
├── services/                      # Layer 2: 業務邏輯
│   ├── init.service.ts
│   ├── steering.service.ts
│   ├── knowledge.service.ts
│   ├── agent-sync.service.ts
│   ├── change-story.service.ts
│   ├── change-plan.service.ts
│   └── change-tasks.service.ts
│
├── lib/                           # Layer 3: 共用工具
│   ├── config.ts                  # .prospec.yaml 讀取/寫入/驗證
│   ├── fs-utils.ts                # 原子寫入、目錄建立、檔案存在檢查
│   ├── yaml-utils.ts              # YAML 解析/生成（comment 保留）
│   ├── scanner.ts                 # 目錄掃描（fast-glob 封裝）
│   ├── detector.ts                # 技術棧偵測
│   ├── template.ts                # Handlebars 模板引擎封裝
│   ├── module-detector.ts         # 模組偵測演算法
│   ├── content-merger.ts          # 使用者/系統內容合併
│   ├── agent-detector.ts          # AI CLI 偵測
│   └── logger.ts                  # 三層 logger（quiet/normal/verbose）
│
├── types/                         # 共用型別定義
│   ├── config.ts                  # ProspecConfig + Zod schema
│   ├── module-map.ts              # ModuleMap type
│   ├── change.ts                  # ChangeMetadata type
│   ├── errors.ts                  # ProspecError hierarchy
│   └── skill.ts                   # Skill type definitions
│
└── templates/                     # Handlebars 模板
    ├── init/                      # prospec init 模板
    │   ├── prospec.yaml.hbs
    │   ├── constitution.md.hbs
    │   ├── agents.md.hbs
    │   ├── conventions.md.hbs
    │   └── index.md.hbs
    ├── skills/                    # prospec-* Skill 模板（核心！）
    │   ├── prospec-explore.hbs
    │   ├── prospec-new-story.hbs
    │   ├── prospec-plan.hbs
    │   ├── prospec-tasks.hbs
    │   ├── prospec-ff.hbs
    │   ├── prospec-implement.hbs
    │   ├── prospec-verify.hbs
    │   └── references/
    │       ├── proposal-format.hbs
    │       ├── plan-format.hbs
    │       ├── delta-spec-format.hbs
    │       ├── tasks-format.hbs
    │       ├── implementation-guide.hbs
    │       └── knowledge-format.hbs
    ├── agent-configs/             # Agent 入口配置模板
    │   ├── claude.md.hbs
    │   ├── gemini.md.hbs
    │   ├── copilot.md.hbs
    │   └── codex.md.hbs
    ├── change/                    # 變更管理模板
    │   ├── proposal.md.hbs
    │   ├── metadata.yaml.hbs
    │   ├── plan.md.hbs
    │   ├── delta-spec.md.hbs
    │   └── tasks.md.hbs
    ├── steering/                  # steering 命令模板
    │   ├── architecture.md.hbs
    │   └── module-readme.hbs
    └── knowledge/                 # knowledge generate 模板
        └── module-map.yaml.hbs

tests/
├── unit/                          # services/ 和 lib/ 的單元測試
│   ├── services/
│   │   ├── init.service.test.ts
│   │   ├── steering.service.test.ts
│   │   ├── knowledge.service.test.ts
│   │   ├── agent-sync.service.test.ts
│   │   ├── change-story.service.test.ts
│   │   ├── change-plan.service.test.ts
│   │   └── change-tasks.service.test.ts
│   └── lib/
│       ├── config.test.ts
│       ├── fs-utils.test.ts
│       ├── yaml-utils.test.ts
│       ├── scanner.test.ts
│       ├── detector.test.ts
│       ├── template.test.ts
│       ├── module-detector.test.ts
│       ├── content-merger.test.ts
│       ├── agent-detector.test.ts
│       └── logger.test.ts
├── integration/                   # 跨層互動測試
│   ├── init-flow.test.ts
│   ├── steering-flow.test.ts
│   ├── change-flow.test.ts
│   └── skill-generation.test.ts
├── contract/                      # 契約驗證
│   ├── cli-output.test.ts
│   └── skill-format.test.ts
└── e2e/                           # 完整命令（真實 tmp dir）
    └── cli.test.ts

docs/                              # 使用者專案內的文件目錄
├── ai-knowledge/
│   ├── _index.md
│   ├── _conventions.md
│   ├── architecture.md
│   ├── module-map.yaml
│   └── modules/
│       └── {module}/
│           └── README.md
├── specs/
│   └── .gitkeep
└── CONSTITUTION.md
```

**Structure Decision**: 採用 Pragmatic Layered Architecture：
- `cli/` → Commander commands + formatters（入口 + 輸出）
- `services/` → Business logic（業務邏輯，每命令一個 service）
- `lib/` → Shared utilities（共用工具，純函數）
- `types/` → Zod schemas + TypeScript types（型別定義）
- `templates/` → 靜態資源（Handlebars `.hbs` 檔案），不屬於任何架構層，僅透過 `lib/template.ts` 存取

**層次約束執行**：使用 ESLint `no-restricted-imports` 規則強制執行跨層依賴約束，在 CI 中驗證。

## Module Design

### M1: Types Layer（`src/types/`）

- `config.ts`: `ProspecConfigSchema`（Zod 4，使用統一 `error` 參數）、`ModuleMapSchema`、`ChangeMetadataSchema`
- `errors.ts`: `ProspecError` 階層（ConfigError, ScanError, WriteError → PermissionError, YamlParseError, TemplateError, ModuleDetectionError, AlreadyExistsError, PrerequisiteError）
- `module-map.ts`: ModuleMap 和 Module 型別
- `change.ts`: ChangeMetadata 型別
- `skill.ts`: Skill 相關型別定義

### M2: Lib Layer（`src/lib/`）

無狀態純函數，可獨立測試：

- `config.ts`: readConfig, writeConfig, validateConfig（Zod 4 schema 驗證）
- `fs-utils.ts`: atomicWrite（暫存檔 → rename）, ensureDir, fileExists
- `yaml-utils.ts`: parseYaml, stringifyYaml（eemeli/yaml Document API，comment 保留）
- `scanner.ts`: scanDir（fast-glob 封裝，depth 控制，negative patterns）
- `detector.ts`: detectTechStack（package.json → TS/Node, requirements.txt → Python）
- `template.ts`: renderTemplate（Handlebars 封裝，registerHelpers, registerPartials）
- `module-detector.ts`: 五步模組偵測（module-map 優先 → 目錄匹配 → 架構識別 → 關鍵字生成 → 衝突解決）
- `content-merger.ts`: mergeContent（`<!-- prospec:auto-start/end -->` + `<!-- prospec:user-start/end -->` 標記解析與合併）
- `agent-detector.ts`: detectAgents（檢查 `~/.claude`, `~/.gemini`, `~/.copilot`, `~/.codex`）
- `logger.ts`: createLogger（quiet/normal/verbose 三層，TTY 偵測，NO_COLOR 支援）

### M3: Services Layer（`src/services/`）

每個 service 對應一個 CLI 命令，封裝完整業務邏輯：

- `init.service.ts`: 初始化邏輯 — configExists 檢查 → detectTechStack → promptAgentSelection → writeConfig + createDirs + renderTemplates
- `steering.service.ts`: 架構掃描 — scanDir → detectArchitecture → generateModuleMap → writeArchitecture
- `knowledge.service.ts`: Knowledge 生成 — readModuleMap → scanModules → generateModuleReadme → updateIndex（ContentMerger 保護使用者區域）
- `agent-sync.service.ts`: **Skill 生成核心** — readConfig(agents) → loadSkillTemplates → injectContext → generateSkillFiles + generateAgentConfigs
- `change-story.service.ts`: 變更需求 — validateNotExists → renderProposal + renderMetadata → matchRelatedModules
- `change-plan.service.ts`: 計劃骨架 — resolveChange → renderPlan + renderDeltaSpec → updateMetadataStatus
- `change-tasks.service.ts`: 任務骨架 — resolveChange → renderTasks

### M4: CLI Layer（`src/cli/`）

- `index.ts`: Commander.js 14 program 定義 + global options + preAction hooks + exitOverride
- `commands/*.ts`: 每個命令註冊到 program，呼叫對應 service
- `formatters/*.ts`: 各命令的輸出格式化（色彩、quiet/verbose 適配）

### M5: Module Detection Algorithm（`src/lib/module-detector.ts`）

五步策略：
1. module-map.yaml 優先（如存在）
2. 目錄名稱匹配
3. 架構模式識別（MVC, Clean Architecture 等）
4. 關鍵字生成
5. 衝突解決

### M6: Skill Templates（`src/templates/skills/`）

每個 `.hbs` 模板生成一個完整的 SKILL.md：
- 可注入變數：`{{project_name}}`、`{{knowledge_base_path}}`、`{{constitution_path}}`、`{{tech_stack}}`
- YAML frontmatter 由模板生成（name, description）
- Skill body 包含工作流程指引、CLI 命令呼叫、context 載入策略
- references/ 子目錄的內容也由模板生成

## AI Knowledge 格式與模板設計

### 目錄結構

```text
docs/
├── ai-knowledge/
│   ├── _index.md                   # 模組索引表
│   ├── _conventions.md             # 專案慣例
│   ├── architecture.md             # 架構分析報告
│   ├── module-map.yaml             # 模組關聯映射
│   └── modules/
│       └── {module}/
│           └── README.md           # 模組說明文件
├── specs/
│   └── .gitkeep
└── CONSTITUTION.md
```

### 系統定義 vs 使用者定義

| 文件 | 生成命令 | 系統區域 | 使用者區域 |
|------|---------|---------|-----------|
| `_index.md` | `knowledge generate` | Module 表格、Project Info | `<!-- prospec:user-start/end -->` 標記區域 |
| `_conventions.md` | `init` | 章節結構骨架 | 各章節具體內容（使用者填寫） |
| `architecture.md` | `steering` | 完整內容 | `<!-- prospec:user-start/end -->` 標記區域 |
| `module-map.yaml` | `steering` | Schema 結構 | 使用者可調整分類/keywords |
| `modules/{m}/README.md` | `knowledge generate` | Overview, Key Files, Public API | `## Internal Notes`（`<!-- prospec:user-start/end -->`） |

### Content Marker Convention

```markdown
<!-- prospec:auto-start -->
（系統自動生成，重新生成時覆寫）
<!-- prospec:auto-end -->

<!-- prospec:user-start -->
（使用者自訂，重新生成時保留）
<!-- prospec:user-end -->
```

## Testing Strategy

### 測試分層

| 測試類型 | 工具 | 範圍 | Mock 策略 |
|---------|------|------|----------|
| Unit Test | Vitest + memfs | `services/`、`lib/` 和 `cli/formatters/` | `vi.mock('node:fs')` + `vol.fromJSON()` |
| Integration Test | Vitest + memfs | 完整命令流程（command → service → lib） | 同 unit |
| Contract Test | Vitest | CLI 輸出格式、Skill 格式（含 Copilot inline 驗證） | 無 mock |
| E2E Test | Vitest + tmp dir | 完整命令執行 | 真實檔案系統 |

### 各層測試策略

- **`cli/formatters/`**：純函數 Unit Test，驗證 quiet/normal/verbose 輸出格式
- **`cli/commands/`**：Integration Test，使用 Commander.js `exitOverride` 捕獲錯誤和輸出
- **`services/`**：Unit Test，透過 memfs mock 檔案系統
- **`lib/`**：Unit Test，純函數獨立測試
- **Contract Test**：驗證 Copilot 格式正確 inline reference 內容（Progressive Disclosure 降級）

### 關鍵測試注意事項

- memfs mock **不會傳播到 child process**，E2E 測試必須使用真實 tmp dir
- 使用 `vol.reset()` 確保每次測試清除狀態
- Commander.js `exitOverride` 在測試中捕獲錯誤而非退出 process

## Implementation Phases

### Phase A: CLI 基礎建設（User Story 0）

- Commander.js 14 program 定義 + global options
- 三層 logger、error-handler、error-output formatter
- Zod 4 ProspecConfig schema、ProspecError 階層
- 型別定義（types/）

### Phase B: 初始化（User Story 1）

- `prospec init`：建立 `.prospec.yaml`、`docs/ai-knowledge/`、`docs/CONSTITUTION.md`、`docs/specs/.gitkeep`、`AGENTS.md`
- AI CLI 偵測、checkbox 互動選擇、技術棧偵測
- `--name`、`--agents`（CI/CD 非互動模式）

### Phase C: 架構分析（User Story 2）

- `prospec steering`：fast-glob 掃描、架構偵測、module-map.yaml 生成
- `--dry-run`、`--depth`

### Phase D: 知識生成（User Story 3）

- `prospec knowledge generate`：模組 README 生成、`_index.md` 更新
- ContentMerger 保護使用者區域
- `--dry-run`

### Phase E: Agent 同步 + Skill 生成（User Story 4）

**此 Phase 是 Skill 架構的核心實現：**

- `prospec agent sync`：
  1. 讀取 `.prospec.yaml` 的 `agents` 設定
  2. 讀取 `src/templates/skills/*.hbs` Skill 模板
  3. 注入專案 context
  4. 為每個啟用的 AI CLI 生成 7 個 Skills
  5. 生成 Agent 入口配置（CLAUDE.md, GEMINI.md 等）
- `--cli` 參數指定特定 CLI
- 原子寫入、更新而非重複建立

### Phase F: 變更管理基礎命令（User Stories 5-7）

CLI 命令提供 Skill 依賴的基礎操作：

- `prospec change story`：建立 `.prospec/changes/<name>/` + proposal.md 骨架 + metadata.yaml
- `prospec change plan`：建立 plan.md 骨架 + delta-spec.md 骨架
- `prospec change tasks`：建立 tasks.md 骨架
- Change 解析策略（自動偵測 / 多選提示 / PrerequisiteError）

**注意**：Planning 類 CLI 命令只負責建立骨架檔案，內容由 AI Agent 透過 `prospec-*` Skills 填充。

## MVP vs Phase 2 對照

| 功能 | MVP | Phase 2 |
|------|:---:|:-------:|
| `prospec init` | ✅ | |
| `prospec steering` | ✅ | |
| `prospec knowledge generate` | ✅ | |
| `prospec agent sync` | ✅（4 CLI） | 8+ CLI |
| `prospec change story` | ✅ | |
| `prospec change plan` | ✅ | |
| `prospec change tasks` | ✅ | |
| `prospec change history` | | ✅ |
| `prospec change quick` | | ✅ |
| `prospec knowledge update` | | ✅ |
| `prospec constitution` | | ✅ |
| `prospec template` | | ✅ |
| Scale Adapter (Quick/Full) | | ✅ |
| Sprint Mode | | ✅ |
| Patch Spec 自動 Sync | | ✅ |
| Skills: explore ~ verify | ✅（7 個） | |
| Skill: archive | | ✅ |

## Risk Assessment

| 風險 | 影響 | 緩解策略 |
|------|------|---------|
| Zod 4 breaking changes | 中 | 鎖定 4.3.x 版本 |
| Cross-platform 路徑差異 | 中 | `path.join` / `path.resolve`，CI 涵蓋 macOS + Linux |
| YAML comment 保留邊緣情況 | 低 | eemeli/yaml Document API |
| CI 環境無互動 | 中 | `--agents` + `--quiet` 跳過互動 |
| 模組偵測準確率 | 中 | M5 五步策略 + 使用者可調整 module-map.yaml |
| Skill 格式跨 AI CLI 差異 | 中 | Handlebars 模板統一管理，contract test 驗證 |
| Copilot 單檔格式限制 | 低 | Reference 內容 inline，犧牲 Layer 3 Progressive Disclosure |
| memfs 不傳播到 child process | 中 | E2E 測試使用真實 tmp dir |
| Skill 內容品質依賴 AI Agent | 中 | Skill 指引盡量具體，verify Skill 驗證產出 |

## Complexity Tracking

> Constitution Check 全部 PASS，無需記錄違規。

無違規項目。架構從 Clean Architecture 簡化為 Pragmatic Layered Architecture，降低了整體複雜度。
