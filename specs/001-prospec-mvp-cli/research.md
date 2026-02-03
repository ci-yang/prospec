> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# 技術研究報告：Prospec MVP CLI

**Branch**: `001-prospec-mvp-cli` | **Date**: 2026-02-04

## Runtime 環境

### Decision: Node.js 24 LTS + Bun 1.3 雙相容

- **Node.js**: 24.13.0 LTS (Krypton) — Active LTS，維護至 2028-04
- **Bun**: 1.3.7 — 最新穩定版
- **Rationale**: 規格要求支援 Node.js 20+ 或 Bun。Node.js 24 LTS 是目前 Active LTS，Commander.js 14 也要求 Node.js v20+。Bun 1.3 完全相容 Node.js API。
- **Alternatives considered**:
  - Deno：生態系尚未足夠成熟，排除
  - Node.js 20 only：仍在 Maintenance LTS，但 Node.js 24 是更好的目標

## 語言

### Decision: TypeScript 5.9

- **Version**: 5.9.3（最新穩定版）
- **Rationale**: TypeScript 6.0 是過渡版本，7.0 使用 Go 編譯器預計 mid-2026。5.9 是目前最穩定的生產版本，支援 `--module node20`，與所有依賴完全相容。
- **Alternatives considered**:
  - TypeScript 6.0：bridge release，不適合新專案起步
  - TypeScript 7.0 native preview：尚未穩定

## CLI 框架

### Decision: Commander.js 14

- **Version**: 14.0.2
- **Rationale**: Node.js CLI 最廣泛採用的框架（npm 108,533 dependents）。v14 支援 helpGroup、subcommand、TypeScript extra typings（`@commander-js/extra-typings` 14.0.0）。完美匹配規格需求的 `prospec <resource> <action>` 命令結構。
- **Key Features（Context7 驗證）**:
  - `preAction` hooks：可在命令執行前統一驗證 `.prospec.yaml` 存在
  - `configureOutput`：自訂 help/error 輸出流，配合 quiet/verbose 模式
  - `exitOverride`：測試時避免 `process.exit()`，拋出 `CommanderError` 代替
  - `error(message, { exitCode, code })`：結構化錯誤回報
- **Alternatives considered**:
  - yargs：API 較冗長，TypeScript 支援不如 Commander
  - clipanion：社群較小
  - oclif：太重，適合大型 CLI 框架

## Schema 驗證

### Decision: Zod 4

- **Version**: 4.3.5（最新穩定版）
- **Rationale**: TypeScript-first schema 驗證庫。v4 比 v3 快 14 倍（string parsing）、bundle 小 57%。
- **Key Features（Context7 驗證）**:
  - 統一 `error` 參數取代 v3 的 `message`、`invalid_type_error`、`required_error`
  - `z.string({ error: "project.name 為必填欄位" })` 直接對應 REQ-CLI-008
  - `z.object().catchall()` 處理不明欄位，配合 `z.passthrough()` 實現 REQ-CLI-009
- **Alternatives considered**:
  - Zod 3.x：v4 已穩定且顯著更快
  - Yup：TypeScript inference 不如 Zod
  - AJV：JSON Schema 導向，不適合 TypeScript-first 專案

## 互動式提示

### Decision: @inquirer/prompts 8

- **Version**: 8.2.0（最新穩定版）
- **Rationale**: 重寫後的 Inquirer 更輕量高效。checkbox prompt 完美匹配 `prospec init` 的 AI Assistant 互動選擇需求。支援 `checked: true` 預設勾選、`disabled` 狀態、`Separator` 分組、`required` 驗證。
- **Alternatives considered**:
  - enquirer：維護較不活躍
  - prompts（terkelg）：功能較簡單，無 checkbox 支援

## YAML 處理

### Decision: yaml 2.x（eemeli/yaml）

- **Version**: 2.x（最新穩定版）
- **Rationale**: 支援 YAML 1.1 和 1.2，完整 TypeScript 支援，支援 comment 保留（重要：使用者可能手動編輯 `.prospec.yaml`）。API 簡潔：`YAML.parse()` / `YAML.stringify()`。
- **Alternatives considered**:
  - js-yaml：不支援 comment 保留
  - @std/yaml (Deno)：不適用 Node.js

## 檔案掃描

### Decision: fast-glob 3

- **Version**: 3.3.3
- **Rationale**: 最高效能的 glob 庫（83M weekly downloads），支援 negative patterns、sync/async/stream API。用於 `prospec steering` 目錄掃描和 `prospec knowledge generate` 路徑模式匹配。
- **Alternatives considered**:
  - tinyglobby 0.2：更少依賴但生態較小
  - node-glob：有 CVE 風險（CVE-2025-64756）
  - Node.js 內建 `fs.glob`：Node.js 24 有但 API 不夠完整

## 終端輸出

### Decision: picocolors 1.1

- **Version**: 1.1.1
- **Rationale**: 比 chalk 小 14 倍、快 2 倍。零依賴、支援 CJS/ESM、NO_COLOR 相容。PostCSS、Vite 等工具都採用。
- **Alternatives considered**:
  - chalk 5：ESM-only，bundle 較大
  - kleur：功能相近但社群較小

## 測試框架

### Decision: Vitest 4

- **Version**: 4.0.17（最新穩定版）
- **Rationale**: Vite 原生測試框架，與 TypeScript 完美整合。
- **Key Features（Context7 驗證）**:
  - `vi.mock('node:fs')` + memfs：完整 fs mock，service 層可獨立 unit test
  - `vol.fromJSON({ '/path': 'content' })` 快速建立虛擬檔案系統
  - `vol.reset()` 每次測試清除狀態
  - `__mocks__/fs.cjs` 自動 mock 模式，但手動 `vi.mock()` 更明確
  - memfs 限制：mock 不會傳播到 child process，E2E 測試需用真實 tmp dir
- **Alternatives considered**:
  - Jest 30：Vitest 更快且原生支援 ESM/TypeScript
  - node:test：功能不夠完整

## 模板引擎

### Decision: Handlebars 4.x

- **Version**: 4.7.8（最新穩定版）
- **Rationale**: 最廣泛採用的 Mustache 系模板引擎（npm 68M weekly downloads）。支援 `{{variable}}`、`{{#if}}`、`{{#each}}`、partial templates。用於 Prospec 的 Skill 模板生成（`src/templates/skills/*.hbs`）和 AI Knowledge 模板（`src/templates/init/*.hbs` 等）。Handlebars 的 logic-less 設計確保模板邏輯簡單，易於維護。
- **Alternatives considered**:
  - EJS：允許任意 JS 嵌入，模板可讀性差
  - Mustache.js：不支援 helpers 和 block expressions
  - Nunjucks：功能過重，適合複雜 web 模板
  - 自建模板引擎：不值得維護成本

## 原子寫入

### Decision: Node.js fs + write-file-atomic pattern

- **Rationale**: 使用 `fs.writeFile` 寫入暫存檔 → `fs.rename` 原子替換。這是標準做法，不需額外依賴。對應 REQ-AGNT-007 原子寫入需求。
- **Alternatives considered**:
  - write-file-atomic npm：額外依賴，同樣邏輯可自行實作

## 架構決策

### CLI 命令結構

根據 Commander.js 14 的 subcommand 模式，命令結構設計為：

```
prospec
├── init                    # 專案初始化
├── steering                # 架構分析（單一命令，無 subcommand）
├── knowledge
│   └── generate            # 知識生成
├── agent
│   └── sync                # Agent 配置同步
└── change
    ├── story <name>        # 建立變更需求
    ├── plan                # 生成實作計劃
    └── tasks               # 拆分任務清單
```

### 專案架構模式

#### Decision: Pragmatic Layered Architecture（務實分層架構）

**不採用 Clean Architecture 的理由**（基於 CLI 最佳實踐研究）：

1. **業界實踐**：研究了 OpenSpec、ESLint、Turborepo、Changesets 等主流 TypeScript CLI 工具，**沒有一個使用完整的 Clean Architecture + Port/Adapter 模式**
2. **Port/Adapter 過度**：對只有 7 個命令的 CLI 工具，為每個 filesystem 操作定義 interface + implementation 是不必要的前期成本
3. **價值有限**：CLI 只有單一入口點（不像 web service 有 REST、GraphQL、CLI 等多入口），framework-agnostic 的價值幾乎為零
4. **ESLint 模式更適合**：ESLint 透過自然的層次約束（「Linter 層不得存取檔案系統」）達成關注點分離，而非透過強制抽象

**採用模式**：Pragmatic Layered Architecture

```
src/
├── cli/         # Layer 1: CLI 入口 — 解析參數、格式化輸出
│                # 約束：不含業務邏輯
├── services/    # Layer 2: 業務邏輯 — 命令實作、流程控制
│                # 約束：不直接操作 process.argv
├── lib/         # Layer 3: 共用工具 — fs 封裝、YAML 處理、模板引擎
│                # 約束：無狀態，純函數
└── types/       # 共用型別定義
```

**層次約束規則**（借鑑 ESLint）：

| Layer | 可存取 | 不可存取 |
|-------|--------|---------|
| `cli/` | `services/`, `types/` | `lib/` 直接存取 |
| `services/` | `lib/`, `types/` | `cli/` |
| `lib/` | `types/` | `cli/`, `services/` |
| `types/` | 無依賴 | 所有其他 |

**參考來源**：

- **OpenSpec**：`commands/ → core/ → utils/`（最接近 Prospec 的 SDD CLI 工具）
- **ESLint**：四層架構 + 嚴格存取約束
- **Changesets**：模組化 monorepo，各 package 處理獨立職責
- **cli-developer skill**：POSIX 慣例、exit codes、piping 支援

#### 為什麼不是 `core/` + `adapters/`？

研究結果指出 **Direct Service Model**（`services/` + `lib/`）提供了 Clean Architecture 90% 的可測試性優勢，但只有 10% 的複雜度：

- `services/` 取代 `core/`：更直觀，業界 CLI 標準命名
- `lib/` 取代 `adapters/`：不需 Port interface，直接封裝 fs/YAML 操作
- 測試：`services/` 層透過 memfs mock `lib/` 的 fs 操作即可獨立測試

### CLI 標準合規

基於 CLI 最佳實踐研究，確認以下標準需求：

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

- 偵測 `process.stdout.isTTY`，非 TTY 時：
  - 停用色彩
  - 停用 spinner/progress
  - 使用 machine-readable 輸出
- `--quiet` 模式停用所有裝飾性輸出

### 錯誤處理策略

- CLI 層：捕獲所有錯誤，格式化顯示，設定 `process.exitCode`
- Services 層：拋出自訂 ProspecError 類型，攜帶 actionable message + suggestion
- Lib 層：將 fs/YAML 錯誤轉換為 ProspecError

### 測試策略

| 測試類型 | 工具 | 範圍 |
|---------|------|------|
| Unit Test | Vitest + memfs | `services/` 和 `lib/` 層 |
| Integration Test | Vitest + memfs | 跨層互動（service → lib） |
| Contract Test | Vitest | CLI 輸出格式驗證 |
| E2E Test | Vitest + tmp dir | 完整命令執行（真實檔案系統） |

關鍵注意事項：memfs mock **不會傳播到 child process**，E2E 測試必須使用真實 tmp dir。

## 依賴版本摘要

| 依賴 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.9.3 | 語言 |
| Commander.js | 14.0.2 | CLI 框架 |
| @commander-js/extra-typings | 14.0.0 | CLI TypeScript 支援 |
| Zod | 4.3.5 | Schema 驗證 |
| @inquirer/prompts | 8.2.0 | 互動式提示 |
| yaml | 2.x | YAML 解析/生成 |
| fast-glob | 3.3.3 | 檔案掃描 |
| picocolors | 1.1.1 | 終端輸出 |
| Handlebars | 4.7.8 | 模板引擎 |
| Vitest | 4.0.17 | 測試框架 |
| memfs | latest | 測試用 fs mock |
