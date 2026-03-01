---
feature: project-setup
status: active
last_updated: 2026-03-02
story_count: 6
req_count: 13
---

# 專案啟動

## Who & Why

**服務對象**：AI-First 開發者、獨立開發者、技術主管

**解決問題**：開發者在專案中導入 SDD 流程需手動建立大量配置檔與目錄結構，過程繁瑣且易遺漏。Prospec 透過 `prospec init` 一鍵初始化與 `prospec steering` 架構分析，讓開發者在 3 分鐘內完成 SDD 專案設定。

**為什麼重要**：專案啟動是 SDD 流程的起點，初始結構不完整則後續階段無法運作。良好的 CLI 基礎設施確保開發者在任何階段都能快速定位問題。

## User Stories & Behavior Specifications

### US-001: CLI 基礎框架 [P0]

身為開發者，
我希望有結構化的 CLI 入口，支援 `--help`、`--version` 和子指令路由，
以便我能探索所有可用指令並了解工具版本。

**Acceptance Scenarios:**
- WHEN 執行 `prospec --help` THEN 顯示所有可用指令及說明
- WHEN 執行 `prospec --version` THEN 顯示版本號
- WHEN 輸入錯誤指令（如 `prospec inti`）THEN 顯示錯誤並建議正確指令

#### REQ-SETUP-001: CLI 入口與指令路由
提供 `prospec` 指令，支援 `--help`、`--version`、子指令路由，遵循 `prospec <command>` 或 `prospec <resource> <action>` 模式。

**Scenarios:**
- WHEN executing `prospec --help`, THEN display all available commands with descriptions
- WHEN executing `prospec --version`, THEN display version from package.json
- WHEN entering invalid command (e.g., `prospec inti`), THEN suggest similar valid commands
- WHEN single-action command (e.g., `init`), THEN use `prospec <command>` format
- WHEN multi-action resource (e.g., change), THEN use `prospec <resource> <action>` format

### US-002: Config 驗證與錯誤處理 [P0]

身為開發者，
我希望 `.prospec.yaml` 有 Schema 驗證，且所有指令提供有意義的錯誤訊息，
以便我能快速定位配置問題並修正。

**Acceptance Scenarios:**
- WHEN `.prospec.yaml` 缺少必填欄位 THEN 顯示具體欄位名稱
- WHEN 指令執行失敗 THEN 錯誤訊息包含問題描述與修正建議
- WHEN 加上 `--verbose` THEN 輸出每一步驟的詳細資訊

#### REQ-SETUP-002: Config Schema 驗證
`.prospec.yaml` 使用 Zod 進行 Schema 定義與驗證，缺少必填欄位時提供具體錯誤訊息。

**Scenarios:**
- WHEN `.prospec.yaml` is valid, THEN successfully parse all fields via Zod schema
- WHEN missing `project.name`, THEN display "project.name is required"
- WHEN multiple required fields missing, THEN list all missing fields
- WHEN contains unknown fields, THEN warn but don't block; suggest correct name if typo

#### REQ-SETUP-003: 錯誤訊息與 Debug 模式
所有指令提供有意義的錯誤訊息，支援 `--verbose` 輸出詳細步驟。

**Scenarios:**
- WHEN command fails, THEN error includes problem description + suggested fix
- WHEN encountering ProspecError, THEN display error code + message + suggestion
- WHEN `--verbose` added, THEN output detailed info for each step
- WHEN no `--verbose`, THEN only output result summary

### US-003: 專案初始化 [P0]

身為開發者，
我希望執行 `prospec init` 即可建立完整的 SDD 專案骨架，
以便我能立即開始 Spec-Driven 開發流程。

**Acceptance Scenarios:**
- WHEN 在空目錄執行 `prospec init` THEN 建立 `.prospec.yaml`、AI Knowledge 目錄、Constitution、AGENTS.md
- WHEN `.prospec.yaml` 已存在 THEN 顯示警告並退出
- WHEN 偵測到 package.json THEN 自動辨識為 TypeScript/Node
- WHEN 偵測到已安裝的 AI CLI THEN 互動式選單讓使用者勾選

#### REQ-SETUP-004: 建立專案結構
執行 `prospec init` 時建立所有必要檔案與目錄：`.prospec.yaml`、`AGENTS.md`、`{base_dir}/ai-knowledge/`（含 `_index.md`、`_conventions.md`）、`{base_dir}/CONSTITUTION.md`、`{base_dir}/specs/`。

**Scenarios:**
- WHEN executing `prospec init` in empty directory, THEN create all required files and directories
- WHEN `_index.md` created, THEN contains empty module table
- WHEN `CONSTITUTION.md` created, THEN contains Principles, Constraints, Quality Standards templates
- WHEN `.prospec.yaml` already exists, THEN show warning and exit without modification

#### REQ-SETUP-005: 自動偵測技術棧
自動偵測程式語言、框架與套件管理器，無法辨識時不阻斷初始化。

**Scenarios:**
- WHEN project has `package.json`, THEN detect as TypeScript/Node
- WHEN project has `pyproject.toml`, THEN detect as Python
- WHEN no recognizable markers, THEN `tech_stack` left empty, init completes normally

#### REQ-SETUP-006: 偵測已安裝的 AI CLI
自動偵測系統已安裝的 AI CLI 工具（Claude Code、Gemini CLI、Copilot、Codex），提供互動式勾選。

**Scenarios:**
- WHEN `~/.claude` exists, THEN detect Claude Code and pre-check
- WHEN `~/.gemini` exists, THEN detect Gemini CLI and pre-check
- WHEN user unchecks detected CLI, THEN `.prospec.yaml` agents excludes it
- WHEN user checks uninstalled CLI, THEN remind but allow adding
- WHEN detection complete, THEN suggest `prospec agent sync`

#### REQ-SETUP-007: 可配置的專案名稱
支援 `--name` 旗標覆蓋自動偵測的目錄名稱。

**Scenarios:**
- WHEN no `--name`, THEN use directory name as project name
- WHEN `--name my-project`, THEN `.prospec.yaml` project.name set accordingly

### US-004: 架構分析與模組映射 [P0]

身為在既有專案導入 Prospec 的開發者，
我希望執行 `prospec steering` 掃描專案架構、偵測技術棧、生成架構報告和模組映射，
以便 AI Knowledge 系統能精準理解專案結構與模組依賴。

**Acceptance Scenarios:**
- WHEN 在已初始化專案執行 `prospec steering` THEN 產出 architecture.md 和 module-map.yaml
- WHEN 專案未初始化 THEN 提示先執行 `prospec init`
- WHEN 指定 `--dry-run` THEN 只輸出預覽不寫入檔案

#### REQ-SETUP-008: 掃描專案架構
遞迴掃描專案目錄結構，偵測架構層級，辨識技術棧，結果回寫 `.prospec.yaml`。

**Scenarios:**
- WHEN initialized project runs `prospec steering`, THEN scan and detect architecture layers (routes/services/models)
- WHEN Python + FastAPI, THEN identify `language: python, framework: fastapi`
- WHEN scan complete, THEN `.prospec.yaml` tech_stack and paths auto-updated
- WHEN uninitialized project, THEN display PrerequisiteError prompting `prospec init`

#### REQ-SETUP-009: 生成架構報告與模組映射
產出 `architecture.md` 和 `module-map.yaml`，支援跨目錄模組分類。

**Scenarios:**
- WHEN scan complete, THEN create `architecture.md` with tech stack, directory structure, architecture layers, entry points
- WHEN scan complete, THEN create `module-map.yaml` with `depends_on`, `used_by`, `keywords`
- WHEN files scattered across directories, THEN related files classified into same module
- WHEN module has `keywords`, THEN subsequent changes can identify related modules via matching

#### REQ-SETUP-010: 掃描控制
支援 `--dry-run` 預覽模式、`--depth` 掃描深度控制、敏感檔案排除。

**Scenarios:**
- WHEN `--dry-run`, THEN output preview only, no file writes
- WHEN `--depth 2`, THEN only scan to 2nd level directory
- WHEN no custom exclusion, THEN default exclude `*.env*`, `*credential*`, `*secret*`
- WHEN `.prospec.yaml` defines `exclude`, THEN use custom exclusion rules

### US-005: Base Directory 設定 [P1]

身為使用 Prospec 的開發者，
我希望 Prospec 產出物放在可配置的 `prospec/` 目錄下而非硬編碼路徑，
以便 Prospec 輸出有清晰的品牌命名空間，與一般專案文件分離。

**Acceptance Scenarios:**
- WHEN `prospec init` 互動模式 THEN 提示選擇 artifacts 目錄（預設 `prospec`）
- WHEN 非互動模式 THEN 使用預設 base directory
- WHEN 所有 Service 需要路徑 THEN 統一使用 `resolveBasePaths()`

#### REQ-SETUP-011: Base Directory 常數與路徑解析
定義 `DEFAULT_BASE_DIR` 常數，`resolveBasePaths()` 從 config 衍生所有標準路徑。

**Scenarios:**
- WHEN base_dir not configured, THEN use default value
- WHEN configured in `.prospec.yaml`, THEN use configured value
- WHEN legacy config has no base_dir, THEN backwards-compatible using `'docs'`
- WHEN config has `paths.base_dir`, THEN derive knowledgePath, constitutionPath, specsPath
- WHEN any service needs paths, THEN uniformly use `resolveBasePaths()`

#### REQ-SETUP-012: Init 互動式 Base Directory 選擇
`prospec init` 互動式提示 base directory 選擇。

**Scenarios:**
- WHEN interactive mode, THEN prompt "Prospec artifacts directory?" (default `prospec`)
- WHEN non-interactive mode, THEN use default base directory
- WHEN user enters custom name, THEN write to `.prospec.yaml` paths.base_dir

### US-006: 第一次使用 Prospec [P0]

身為第一次接觸 Prospec 的開發者，
我希望從安裝到完成第一個 SDD 流程的體驗流暢且有引導，
以便我能在 10 分鐘內理解 Prospec 的價值並開始使用。

**Acceptance Scenarios:**
- WHEN 安裝後執行 `prospec --help` THEN 看到清晰的指令列表
- WHEN 執行 `prospec init` THEN 互動式引導完成所有設定
- WHEN 初始化完成 THEN 輸出摘要含下一步建議
- WHEN 執行 `prospec steering` THEN 自動分析專案並產出 AI Knowledge

#### REQ-SETUP-013: 首次使用引導流程
初始化完成後提供清晰的下一步建議與操作摘要。

**Scenarios:**
- WHEN init complete, THEN output summary with created files, next steps (`prospec steering`, `prospec agent sync`), estimated time
- WHEN steering complete, THEN suggest next action based on project state

## Edge Cases

- 在非專案目錄執行 `prospec steering`：提示沒有可分析的程式結構
- `.prospec.yaml` 格式錯誤（YAML 語法）：提供具體錯誤位置與修正建議
- 重複執行 `prospec init`：警告並退出，不修改既有檔案
- 使用者勾選未安裝的 AI CLI：提醒但允許加入配置
- 磁碟空間不足：使用 atomic write，保留原檔並顯示具體錯誤
- 無法辨識的指令輸入：顯示錯誤並建議相似指令
- 專案使用不支援的架構模式：允許手動配置 `paths`

## Success Criteria

- **SC-1**: 新專案可在 3 分鐘內完成 Prospec 初始化
- **SC-2**: 所有 Prospec 服務統一使用 `resolveBasePaths()` 進行路徑解析
- **SC-3**: 90% 的 Brownfield 專案可透過 steering 自動辨識架構模式
- **SC-4**: 第一次使用的開發者可在 10 分鐘內理解並執行完整 Greenfield 流程
- **SC-5**: 所有 CLI 指令可透過 `--help` 探索
- **SC-6**: 100% 的無效指令輸入都能收到有意義的錯誤訊息或指令建議

## Maintenance Rules

1. **Replace-in-Place**: MODIFIED 需求直接替換為最新狀態
2. **Functional Grouping**: 新需求插入對應的功能分組
3. **No Inline Provenance**: 歷史追溯只在 Change History 中
4. **Deprecation over Deletion**: 移除的需求搬到 Deprecated 區段

## Deprecated Requirements

_(None)_

## Change History

| Date | Change | Impact | Stories/REQs |
|------|--------|--------|-------------|
| 2026-02-04 | mvp-initial | CLI 基礎框架、專案初始化、架構分析 | US-001~004, REQ-SETUP-001~010 |
| 2026-02-09 | configure-base-dir | 可配置的 Base Directory | US-005, REQ-SETUP-011~012 |
| 2026-03-02 | v2-product-first | 合併為 Feature Spec，新增首次使用 Story | US-006, REQ-SETUP-013 |
