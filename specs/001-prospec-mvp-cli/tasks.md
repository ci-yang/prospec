> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# Tasks: Prospec MVP CLI

**Input**: Design documents from `/specs/001-prospec-mvp-cli/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/cli-commands.md, research.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可並行執行（不同檔案，無相互依賴）
- **[Story]**: 所屬 User Story（US0-US7，對應 spec.md）
- 所有路徑以 repository root 為基準

## 工具標註說明

本任務清單特別標註了各任務建議使用的工具/技能：

| 標註 | 說明 | 使用時機 |
|------|------|---------|
| 🎨 `@cli-ui-designer` | 呼叫 cli-ui-designer agent | 終端輸出排版、色彩設計、互動式 UI |
| 🔧 `/cli-developer` | 使用 cli-developer skill | CLI 架構、Commander.js 模式、POSIX 慣例 |
| 📚 `context7` | 使用 Context7 MCP 查詢文檔 | 不確定 API 用法時查詢最新文檔 |

---

## Phase 1: Setup（專案初始化）

**Purpose**: 建立專案基礎結構、安裝依賴、配置開發工具

- [x] T001 初始化 TypeScript 專案：`npm init`、建立 `tsconfig.json`（`"module": "node20"`）、`package.json` bin 入口設為 `dist/cli/index.js` — 📚 `context7`：查詢 TypeScript 5.9 的 `tsconfig.json` 最佳配置
- [x] T002 安裝所有 production 依賴：`commander@14`, `@commander-js/extra-typings@14`, `zod@4`, `@inquirer/prompts@8`, `yaml@2`, `fast-glob@3`, `picocolors@1`, `handlebars@4` — 📚 `context7`：確認各套件的正確 npm package name
- [x] T003 [P] 安裝 dev 依賴並配置：`vitest@4`, `memfs`, `typescript@5.9`, `@types/node` — 建立 `vitest.config.ts`
- [x] T004 [P] 配置 ESLint，設定 `no-restricted-imports` 強制層次約束規則（`cli/` 不可 import `lib/`、`services/` 不可 import `cli/`、`lib/` 不可 import `services/` 和 `cli/`）— 🔧 `/cli-developer`：確認 ESLint flat config 最佳實踐
- [x] T005 [P] 建立完整目錄結構（依 plan.md Project Structure 區段）：`src/cli/commands/`、`src/cli/formatters/`、`src/services/`、`src/lib/`、`src/types/`、`src/templates/{init,skills,skills/references,agent-configs,change,steering,knowledge}/`、`tests/{unit/services,unit/lib,integration,contract,e2e}/`

---

## Phase 2: Foundational — CLI 基礎建設（US0, Priority: P0）

**Purpose**: 型別定義、核心工具函數、CLI 框架入口 — 所有 User Story 的共用基礎設施

**⚠️ CRITICAL**: 此 Phase 必須完成後才能開始任何 User Story

### Types Layer（`src/types/`）

- [x] T006 [P] 建立 `src/types/errors.ts`：ProspecError base class（含 `message`, `code`, `suggestion`）+ 完整 error hierarchy（ConfigNotFound, ConfigInvalid, ScanError, WriteError, PermissionError, YamlParseError, TemplateError, ModuleDetectionError, AlreadyExistsError, PrerequisiteError）
- [x] T007 [P] 建立 `src/types/config.ts`：使用 Zod 4 定義 `ProspecConfigSchema`（project.name required、tech_stack optional、paths Record、exclude string[]、agents string[]、knowledge.base_path）— 使用統一 `error` 參數（如 `z.string({ error: "project.name 為必填欄位" })`）— 📚 `context7`：查詢 Zod 4 的 `z.object().catchall()` 和 `z.passthrough()` 正確用法
- [x] T008 [P] 建立 `src/types/module-map.ts`：ModuleMap schema（modules[].name, description, paths[], keywords[], relationships.depends_on[], used_by[]）
- [x] T009 [P] 建立 `src/types/change.ts`：ChangeMetadata schema（name, created_at ISO 8601, status enum: story|plan|tasks, related_modules[], description）

### Lib Layer 核心工具（`src/lib/`）

- [x] T010 [P] 建立 `src/lib/logger.ts`：createLogger 工廠函數，三層模式（quiet: 只 stderr errors、normal: 結果摘要、verbose: 每步驟詳細）+ TTY 偵測（`process.stdout.isTTY`）+ picocolors 色彩支援 — 🎨 `@cli-ui-designer`：設計三層 logger 輸出風格（成功 ✓、警告 ⚠、錯誤 ✗ 等符號選擇）— 📚 `context7`：查詢 picocolors API（`pc.green()`, `pc.red()`, `pc.dim()` 等）
- [x] T011 [P] 建立 `src/lib/fs-utils.ts`：`atomicWrite`（寫入暫存檔 → `fs.rename` 原子替換）、`ensureDir`（遞迴建立目錄）、`fileExists`（同步檢查存在）
- [x] T012 [P] 建立 `src/lib/yaml-utils.ts`：`parseYaml` / `stringifyYaml`，使用 eemeli/yaml Document API 保留 comment — 📚 `context7`：查詢 eemeli/yaml 2.x 的 Document API 和 comment 保留用法
- [x] T013 建立 `src/lib/config.ts`：`readConfig`（讀取 `.prospec.yaml` + Zod 驗證）、`writeConfig`（原子寫入 + comment 保留）、`validateConfig`（REQ-CLI-007~009：缺少 project.name 報錯、不明欄位警告不阻擋）— 依賴 T007, T011, T012

### CLI Layer 入口（`src/cli/`）

- [x] T014 建立 `src/cli/index.ts`：Commander.js 14 program 定義（`.name('prospec')`, `.version()`, `.configureOutput()`, `.exitOverride()`）+ global options（`--verbose`, `--quiet`, `--version`）+ `preAction` hook 統一檢查 `.prospec.yaml` 存在 — 🔧 `/cli-developer`：設計 Commander.js 14 的 subcommand 結構模式（`program.command('change').command('story')`） — 📚 `context7`：查詢 Commander.js 14 的 `preAction` hook、`configureOutput`、`exitOverride` 用法
- [x] T015 [P] 建立 `src/cli/formatters/error-output.ts`：格式化 ProspecError（顯示 message + suggestion）、統一 catch block 設定 `process.exitCode` — 🎨 `@cli-ui-designer`：設計錯誤訊息排版（紅色標題、灰色 suggestion、退出碼提示）

**Checkpoint**: CLI 基礎設施就緒 — `prospec --help`、`prospec --version` 可執行，錯誤處理框架到位

---

## Phase 3: User Story 1 — 初始化新專案 (Priority: P1) 🎯 MVP

**Goal**: 開發者可透過 `prospec init` 快速建立標準化專案結構

**Independent Test**: 在空目錄執行 `prospec init`，驗證 `.prospec.yaml`、`docs/ai-knowledge/`、`docs/CONSTITUTION.md`、`AGENTS.md`、`docs/specs/.gitkeep` 正確建立

### Implementation

- [x] T016 [P] [US1] 建立 `src/lib/detector.ts`：`detectTechStack`（掃描 package.json → TypeScript/Node、requirements.txt/pyproject.toml → Python、未辨識 → 留空）
- [x] T017 [P] [US1] 建立 `src/lib/agent-detector.ts`：`detectAgents`（檢查 `~/.claude`, `~/.gemini`, `~/.copilot`, `~/.codex` 目錄是否存在，回傳 `{name, detected}[]`）
- [x] T018 [P] [US1] 建立 `src/lib/template.ts`：Handlebars 模板引擎封裝 — `renderTemplate(name, context)`、`registerHelpers`、`registerPartials`、從 `src/templates/` 目錄載入 `.hbs` 檔案 — 📚 `context7`：查詢 Handlebars 4.x 的 `Handlebars.compile()`、`registerHelper()`、`registerPartial()` 用法
- [x] T019 [P] [US1] 建立 init 模板檔案（`src/templates/init/`）：`prospec.yaml.hbs`（含 version, project, tech_stack, paths, exclude, agents, knowledge 區塊）、`constitution.md.hbs`（骨架模板）、`agents.md.hbs`（通用指令）、`conventions.md.hbs`（章節骨架）、`index.md.hbs`（空索引表）
- [x] T020 [US1] 建立 `src/services/init.service.ts`：完整初始化流程 — configExists 檢查（已存在 → AlreadyExistsError）→ detectTechStack → promptAgentSelection（@inquirer/prompts checkbox，已偵測預設勾選）→ writeConfig + createDirs + renderTemplates — 依賴 T013, T016, T017, T018, T019 — 📚 `context7`：查詢 @inquirer/prompts 8 的 checkbox API（`checked`, `disabled`, `Separator`, `required`）
- [x] T021 [US1] 建立 `src/cli/commands/init.ts`：註冊 `init` 命令（`--name <name>`, `--agents <list>`），呼叫 initService — `--agents` 跳過互動選擇（CI/CD 模式） — 🔧 `/cli-developer`：確認 Commander.js 的 option parsing 模式（comma-separated list → string[]）
- [x] T022 [US1] 建立 `src/cli/formatters/init-output.ts`：格式化 init 結果 — 檔案建立清單（✓ Created ...）、Tech stack detected、AI Assistants 偵測結果（✓ detected / ○ not installed）、Selected agents、建議 `prospec agent sync` — 🎨 `@cli-ui-designer`：設計 init 輸出的完整排版（對照 contracts/cli-commands.md 的 Output 範例）

**Checkpoint**: `prospec init` 完整可用 — Greenfield 專案可完成初始化

---

## Phase 4: User Story 2 — 分析現有專案架構 (Priority: P1)

**Goal**: 技術負責人可透過 `prospec steering` 自動掃描理解 Brownfield 專案架構

**Independent Test**: 在有程式碼的專案中執行 `prospec steering`，驗證 `architecture.md` 和 `module-map.yaml` 正確生成

### Implementation

- [ ] T023 [P] [US2] 建立 `src/lib/scanner.ts`：`scanDir` 封裝 fast-glob — 支援 `depth` 控制、negative patterns（排除 node_modules, .git, exclude patterns）、內建敏感檔案預設排除（`*.env*`、`*credential*`、`*secret*`，REQ-STEER-008）、sync/async API — 📚 `context7`：查詢 fast-glob 3 的 `fg.glob()` API（options: `deep`, `ignore`, `onlyFiles`, `cwd`）
- [ ] T024 [P] [US2] 建立 `src/lib/module-detector.ts`：五步模組偵測演算法 — ① module-map.yaml 優先（如存在）→ ② 目錄名稱匹配 → ③ 架構模式識別（MVC, Clean Architecture, 三層架構）→ ④ 關鍵字生成 → ⑤ 衝突解決（分散在不同目錄的相關檔案歸入同一模組）
- [ ] T025 [P] [US2] 建立 steering 模板（`src/templates/steering/`）：`architecture.md.hbs`（Tech Stack 表格、Directory Structure、Architecture Layers、Entry Points、Key Design Decisions）、`module-readme.hbs`（Phase 5 共用）
- [ ] T026 [US2] 建立 `src/services/steering.service.ts`：掃描 → 偵測架構 → 生成 module-map.yaml → 寫入 architecture.md → 更新 .prospec.yaml 的 tech_stack 和 paths — 支援 `--dry-run`（只預覽不寫入）、`--depth`（掃描深度）— 依賴 T023, T024, T025
- [ ] T027 [US2] 建立 `src/cli/commands/steering.ts`：註冊 `steering` 命令（`--dry-run`, `--depth <n>`），呼叫 steeringService — 🔧 `/cli-developer`：設定 Commander.js option 的 number 型別轉換（`--depth <n>` → parseInt）
- [ ] T028 [US2] 建立 `src/cli/formatters/steering-output.ts`：格式化 steering 結果 — 掃描摘要（檔案數、模組數）、architecture.md 路徑、module-map.yaml 路徑、dry-run 提示 — 🎨 `@cli-ui-designer`：設計掃描進度和結果輸出排版

**Checkpoint**: `prospec steering` 完整可用 — Brownfield 專案可自動分析架構

---

## Phase 5: User Story 3 — 生成 AI Knowledge (Priority: P2)

**Goal**: 開發者可透過 `prospec knowledge generate` 為專案生成 AI 可理解的模組知識文件

**Independent Test**: 執行 `prospec knowledge generate` 後，驗證 `modules/{module}/README.md` 生成，且 `_index.md` 索引更新

### Implementation

- [ ] T029 [P] [US3] 建立 `src/lib/content-merger.ts`：`mergeContent` — 解析 `<!-- prospec:auto-start/end -->` 和 `<!-- prospec:user-start/end -->` 標記，重新生成時覆寫系統區域、保留使用者區域
- [ ] T030 [P] [US3] 建立 knowledge 模板（`src/templates/knowledge/`）：`module-map.yaml.hbs`（modules schema）— 並確認 `src/templates/steering/module-readme.hbs` 可供 knowledge generate 複用（README.md 模板：Overview, Key Files, Public API, Internal Notes 使用者區域）
- [ ] T031 [US3] 建立 `src/services/knowledge.service.ts`：readModuleMap → scanModules（遵循 .prospec.yaml exclude 模式排除敏感檔案，REQ-KNOW-007）→ generateModuleReadme（每個模組一個 README.md）→ updateIndex（_index.md Markdown 表格）— ContentMerger 保護使用者區域 — 支援 `--dry-run` — 依賴 T029, T030, T018
- [ ] T032 [US3] 建立 `src/cli/commands/knowledge-generate.ts`：註冊 `knowledge generate` 子命令（`--dry-run`），呼叫 knowledgeService — 🔧 `/cli-developer`：設計 Commander.js nested subcommand（`program.command('knowledge').command('generate')`）

**Checkpoint**: `prospec knowledge generate` 完整可用 — AI Knowledge 漸進式揭露機制建立

---

## Phase 6: User Story 4 — 同步 Agent 配置 (Priority: P2)

**Goal**: 開發者可透過 `prospec agent sync` 生成 AI Agent 配置和 7 個 SDD Skills

**Independent Test**: 執行 `prospec agent sync` 後，驗證 `CLAUDE.md` 精簡且 < 100 行，`.claude/skills/prospec-*/SKILL.md` 7 個 Skills 都存在

### Implementation

- [ ] T033 [P] [US4] 建立 `src/types/skill.ts`：Skill 相關型別 — SkillConfig（name, description, type: Planning|Execution|Lifecycle, cliDependency?, hasReferences）、AgentConfig（name, skillPath, configPath, format）
- [ ] T034 [P] [US4] 建立 7 個 Skill 模板（`src/templates/skills/`）：`prospec-explore.hbs`、`prospec-new-story.hbs`、`prospec-plan.hbs`、`prospec-tasks.hbs`、`prospec-ff.hbs`、`prospec-implement.hbs`、`prospec-verify.hbs` — 每個含 YAML frontmatter（name, description + 觸發詞）+ 工作流程指引 + CLI 命令呼叫 + context 載入策略 — 內容依據 plan.md Skills 詳細設計區段（含 Constitution 檢查指引）— 🎨 `@cli-ui-designer`：設計 Skill YAML frontmatter 的 description 觸發詞格式
- [ ] T035 [P] [US4] 建立 6 個 reference 模板（`src/templates/skills/references/`）：`proposal-format.hbs`、`plan-format.hbs`、`delta-spec-format.hbs`、`tasks-format.hbs`、`implementation-guide.hbs`、`knowledge-format.hbs`
- [ ] T036 [P] [US4] 建立 4 個 Agent 入口配置模板（`src/templates/agent-configs/`）：`claude.md.hbs`（精簡 < 100 行，含 AI Knowledge 路徑和 Constitution 參考）、`gemini.md.hbs`、`copilot.md.hbs`（GitHub Copilot 特殊格式：YAML `applyTo` frontmatter + reference 內容 inline）、`codex.md.hbs` — 🎨 `@cli-ui-designer`：設計 Agent 入口配置的精簡排版
- [ ] T037 [US4] 建立 `src/services/agent-sync.service.ts`：**Skill 生成核心** — readConfig(agents) → loadSkillTemplates → injectContext(project_name, knowledge_base_path, constitution_path, tech_stack) → 為每個 agent 生成 7 個 Skills + 入口配置 — Copilot 特殊處理（單檔 `.instructions.md`，reference inline）— 原子寫入、更新而非重複建立 — 支援 `--cli` 指定特定 CLI — 依賴 T033, T034, T035, T036, T018
- [ ] T038 [US4] 建立 `src/cli/commands/agent-sync.ts`：註冊 `agent sync` 子命令（`--cli <name>`），呼叫 agentSyncService — 🔧 `/cli-developer`：設計 Commander.js nested subcommand（`program.command('agent').command('sync')`）
- [ ] T039 [US4] 建立 `src/cli/formatters/agent-sync-output.ts`：格式化 agent sync 結果 — 列出每個 agent 生成的檔案（CLAUDE.md、7 個 Skills 路徑）— 🎨 `@cli-ui-designer`：設計多 Agent 同步結果的樹狀輸出

**Checkpoint**: `prospec agent sync` 完整可用 — 4 個 AI Agent 的配置 + 7 個 Skills 一次同步

---

## Phase 7: User Story 5 — 建立變更需求 (Priority: P3)

**Goal**: 開發者可透過 `prospec change story` 建立結構化的變更需求目錄

**Independent Test**: 執行 `prospec change story add-feature` 後，驗證 `.prospec/changes/add-feature/proposal.md` 和 `metadata.yaml` 正確建立

### Implementation

- [ ] T040 [P] [US5] 建立 change 模板（`src/templates/change/`）：`proposal.md.hbs`（User Story 格式骨架：As a / I want / So that + 驗收標準區域 + Related Modules + Notes）、`metadata.yaml.hbs`（name, created_at, status: story, related_modules, description）
- [ ] T041 [US5] 建立 `src/services/change-story.service.ts`：validateNotExists（目錄已存在 → AlreadyExistsError）→ renderProposal + renderMetadata → matchRelatedModules（讀取 `_index.md` 關鍵字比對變更名稱）— 依賴 T040, T018, T013
- [ ] T042 [US5] 建立 `src/cli/commands/change-story.ts`：註冊 `change story <name>` 命令（`--description <desc>`），呼叫 changeStoryService — 🔧 `/cli-developer`：設計 Commander.js argument + option 組合（required argument `<name>` + optional option `--description`）

**Checkpoint**: `prospec change story` 完整可用 — 變更管理目錄結構建立

---

## Phase 8: User Story 6 — 生成實作計劃 (Priority: P3)

**Goal**: 開發者可透過 `prospec change plan` 生成包含 Delta Spec 的計劃骨架

**Independent Test**: 在有 `proposal.md` 的變更目錄中執行 `prospec change plan`，驗證 `plan.md` 和 `delta-spec.md` 正確生成

### Implementation

- [ ] T043 [P] [US6] 建立 change plan 模板（`src/templates/change/`）：`plan.md.hbs`（概述、受影響模組、實作步驟、風險考量骨架）、`delta-spec.md.hbs`（ADDED/MODIFIED/REMOVED 格式骨架，REQ ID 遵循 `REQ-{MODULE}-{NUMBER}`）
- [ ] T044 [US6] 建立 `src/services/change-plan.service.ts`：resolveChange（自動偵測 / 多選提示 / `--quiet` 模式報錯 / PrerequisiteError）→ 讀取 proposal.md 驗證存在 → renderPlan + renderDeltaSpec → updateMetadataStatus(`plan`) — 依賴 T043, T018, T013
- [ ] T045 [US6] 建立 `src/cli/commands/change-plan.ts`：註冊 `change plan` 命令（`--change <name>`），呼叫 changePlanService — Change Resolution Strategy 依 contracts/cli-commands.md 實作

**Checkpoint**: `prospec change plan` 完整可用 — 計劃和 Delta Spec 骨架建立

---

## Phase 9: User Story 7 — 拆分任務清單 (Priority: P3)

**Goal**: 開發者可透過 `prospec change tasks` 生成按架構層次排序的任務清單骨架

**Independent Test**: 在有 `plan.md` 的變更目錄中執行 `prospec change tasks`，驗證 `tasks.md` 正確生成且為 checkbox 格式

### Implementation

- [ ] T046 [P] [US7] 建立 tasks 模板（`src/templates/change/tasks.md.hbs`）：checkbox 格式骨架（`- [ ]`）、按架構層次分組（Models → Services → Routes → Tests）、複雜度估算佔位（`~{lines} lines`）、`[P]` 並行標記佔位、摘要佔位（總任務數、可並行數、總估算行數）
- [ ] T047 [US7] 建立 `src/services/change-tasks.service.ts`：resolveChange（同 change-plan 解析策略）→ 讀取 plan.md 驗證存在 → renderTasks → updateMetadataStatus(`tasks`) — 依賴 T046, T018, T013
- [ ] T048 [US7] 建立 `src/cli/commands/change-tasks.ts`：註冊 `change tasks` 命令（`--change <name>`），呼叫 changeTasksService

**Checkpoint**: `prospec change tasks` 完整可用 — 完整變更管理 CLI（story → plan → tasks）就緒

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 跨命令整合、測試、品質保障

- [ ] T049 [P] 建立 `tests/unit/lib/` 單元測試：`config.test.ts`、`fs-utils.test.ts`、`yaml-utils.test.ts`、`logger.test.ts`、`detector.test.ts`、`agent-detector.test.ts`、`scanner.test.ts`、`template.test.ts`、`module-detector.test.ts`、`content-merger.test.ts` — 使用 Vitest + memfs（`vi.mock('node:fs')` + `vol.fromJSON()`）— 📚 `context7`：查詢 Vitest 4 的 `vi.mock()` 和 memfs 的 `vol.fromJSON()` / `vol.reset()` 用法
- [ ] T050 [P] 建立 `tests/unit/services/` 單元測試：`init.service.test.ts`、`steering.service.test.ts`、`knowledge.service.test.ts`、`agent-sync.service.test.ts`、`change-story.service.test.ts`、`change-plan.service.test.ts`、`change-tasks.service.test.ts` — 透過 memfs mock 檔案系統
- [ ] T051 [P] 建立 `tests/contract/cli-output.test.ts`：驗證各命令的 CLI 輸出格式符合 contracts/cli-commands.md 定義 — 使用 Commander.js `exitOverride` 捕獲輸出 — 📚 `context7`：查詢 Commander.js 14 的 `exitOverride` 在測試中的用法
- [ ] T052 [P] 建立 `tests/contract/skill-format.test.ts`：驗證生成的 SKILL.md 格式（YAML frontmatter 存在、name/description 欄位、Copilot 格式正確 inline reference）
- [ ] T053 建立 `tests/integration/init-flow.test.ts`、`steering-flow.test.ts`、`change-flow.test.ts`、`skill-generation.test.ts`：跨層互動測試（command → service → lib 完整流程）
- [ ] T054 建立 `tests/e2e/cli.test.ts`：完整 CLI E2E 測試 — 使用真實 tmp dir（memfs 不傳播到 child process）— 📚 `context7`：查詢 Vitest 4 的 `beforeEach` / `afterEach` 中使用 `fs.mkdtemp()` 建立臨時目錄的最佳實踐
- [ ] T055 [P] 在 `src/cli/index.ts` 加入命令建議功能：輸入錯誤命令時（如 `prospec inti`）顯示 "Did you mean 'init'?"（REQ-CLI-006）— 🔧 `/cli-developer`：確認 Commander.js 14 是否內建此功能或需自行實作
- [ ] T056 執行 quickstart.md 驗證：依 quickstart.md 的 Greenfield 和 Brownfield 工作流程端到端執行一遍，確認所有步驟可正常完成

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 無依賴 — 立即開始
- **Phase 2 (Foundational/US0)**: 依賴 Phase 1 — **阻擋所有 User Story**
- **Phase 3 (US1)**: 依賴 Phase 2 — 可與 Phase 4 並行（如有多人）
- **Phase 4 (US2)**: 依賴 Phase 2 — 可與 Phase 3 並行
- **Phase 5 (US3)**: 依賴 Phase 4（需要 module-map.yaml）
- **Phase 6 (US4)**: 依賴 Phase 5（需要 AI Knowledge）+ Phase 3（需要 init）
- **Phase 7 (US5)**: 依賴 Phase 2 — 可與 Phase 3-6 並行
- **Phase 8 (US6)**: 依賴 Phase 7（需要 proposal.md）
- **Phase 9 (US7)**: 依賴 Phase 8（需要 plan.md）
- **Phase 10 (Polish)**: 依賴所有 User Story 完成

### User Story Dependencies

```
US0 (P0) ─── 所有 Story 的基礎
  │
  ├── US1 (P1) init ────────────────┐
  │                                  ├── US4 (P2) agent sync
  ├── US2 (P1) steering ── US3 (P2) knowledge ──┘
  │
  ├── US5 (P3) change story ── US6 (P3) change plan ── US7 (P3) change tasks
  │
  └── [US1 和 US2 可並行；US5-7 是序列依賴]
```

### Within Each User Story

- Types/Lib（純函數）先於 Services
- Services 先於 CLI Commands
- CLI Commands 先於 Formatters
- Templates 可與同 Phase 的 Lib 並行

### Parallel Opportunities

**Phase 2 內部並行**：
- T006, T007, T008, T009（所有 types 定義）可完全並行
- T010, T011, T012（核心 lib 工具）可完全並行

**Phase 3 內部並行**：
- T016, T017, T018, T019（lib 工具 + 模板）可完全並行

**Phase 6 內部並行**：
- T033, T034, T035, T036（types + 所有模板）可完全並行

**跨 Phase 並行**（多人團隊）：
- Phase 3 (US1) 和 Phase 4 (US2) 可由不同人同時進行
- Phase 7 (US5) 可在 Phase 3-6 期間由另一人開始

---

## Parallel Example: Phase 2

```bash
# 所有 types 定義可同時啟動：
Task: "T006 ProspecError hierarchy in src/types/errors.ts"
Task: "T007 ProspecConfig Zod schema in src/types/config.ts"
Task: "T008 ModuleMap type in src/types/module-map.ts"
Task: "T009 ChangeMetadata type in src/types/change.ts"

# Types 完成後，所有核心 lib 可同時啟動：
Task: "T010 logger in src/lib/logger.ts"
Task: "T011 fs-utils in src/lib/fs-utils.ts"
Task: "T012 yaml-utils in src/lib/yaml-utils.ts"
```

## Parallel Example: Phase 6

```bash
# 所有模板可同時啟動：
Task: "T034 7 Skill templates in src/templates/skills/"
Task: "T035 6 reference templates in src/templates/skills/references/"
Task: "T036 4 agent config templates in src/templates/agent-configs/"
Task: "T033 Skill types in src/types/skill.ts"
```

---

## Implementation Strategy

### MVP First（US0 + US1 Only）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (US0)
3. 完成 Phase 3: User Story 1 (prospec init)
4. **STOP and VALIDATE**: 測試 `prospec init` 獨立可用
5. 可直接 publish 為 v0.1.0

### Core Workflow（+ US2, US3, US4）

6. 完成 Phase 4: User Story 2 (prospec steering)
7. 完成 Phase 5: User Story 3 (prospec knowledge generate)
8. 完成 Phase 6: User Story 4 (prospec agent sync)
9. **STOP and VALIDATE**: 測試完整 Brownfield 工作流（init → steering → knowledge → agent sync）
10. 可 publish 為 v0.2.0

### Full MVP（+ US5, US6, US7）

11. 完成 Phase 7-9: User Stories 5-7 (change story/plan/tasks)
12. 完成 Phase 10: Polish & Tests
13. **STOP and VALIDATE**: 端到端測試 Greenfield + Brownfield 工作流
14. Publish 為 v1.0.0

### Parallel Team Strategy

| 開發者 A | 開發者 B |
|---------|---------|
| Phase 1-2（共同完成） | Phase 1-2（共同完成） |
| Phase 3 (US1: init) | Phase 4 (US2: steering) |
| Phase 6 (US4: agent sync) | Phase 5 (US3: knowledge) |
| Phase 7-9 (US5-7: change) | Phase 10 (Tests) |

---

## Summary

| 項目 | 數值 |
|------|------|
| **總任務數** | 56 |
| **Setup (Phase 1)** | 5 tasks |
| **Foundational/US0 (Phase 2)** | 10 tasks |
| **US1 init (Phase 3)** | 7 tasks |
| **US2 steering (Phase 4)** | 6 tasks |
| **US3 knowledge (Phase 5)** | 4 tasks |
| **US4 agent sync (Phase 6)** | 7 tasks |
| **US5 change story (Phase 7)** | 3 tasks |
| **US6 change plan (Phase 8)** | 3 tasks |
| **US7 change tasks (Phase 9)** | 3 tasks |
| **Polish (Phase 10)** | 8 tasks |
| **可並行任務數** | 34 (61%) |
| **MVP 最小範圍** | Phase 1-3（22 tasks = US0 + US1） |

---

## Notes

- [P] 標記 = 不同檔案、無依賴，可並行執行
- [Story] 標記 = 對應 spec.md 的 User Story（US0-US7）
- 🎨 `@cli-ui-designer` = 終端 UI 設計任務，呼叫 cli-ui-designer agent 協助排版
- 🔧 `/cli-developer` = CLI 開發模式任務，使用 cli-developer skill 確認最佳實踐
- 📚 `context7` = API 用法不確定時，使用 Context7 MCP 查詢最新文檔
- 每個 Checkpoint 後應驗證該 Story 獨立可用
- 每完成一個任務或邏輯群組後 commit
- Templates（`.hbs` 檔案）的內容需參考 plan.md 的 Skill 詳細設計和 data-model.md 的 Schema
