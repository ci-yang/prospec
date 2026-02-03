> **Language**: This document MUST be written in Traditional Chinese. Technical terms may remain in English.

# Feature Specification: Prospec MVP CLI

**Feature Branch**: `001-prospec-mvp-cli`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Prospec MVP CLI - 漸進式規格驅動開發工具"

## User Scenarios & Testing *(mandatory)*

### User Story 0 - CLI 基礎建設 (Priority: P0)

開發者安裝 `prospec` 後，需要一個穩定的 CLI 入口點，包含 help 說明、版本資訊、錯誤建議、設定檔驗證和 verbose 除錯模式，作為所有功能的基礎。

**Why this priority**: 這是所有命令的共用基礎設施。沒有 CLI 框架、設定檔 Schema 驗證和 verbose 模式，任何功能命令都無法正確運作。

**Independent Test**: 安裝 `prospec` 後可執行 `prospec --help`、`prospec --version`、輸入錯誤命令驗證建議、驗證 `.prospec.yaml` schema 檢查、以及 `--verbose` 模式輸出。

**Acceptance Scenarios**:

1. **Given** 已安裝 prospec，**When** 執行 `prospec --help`，**Then** 顯示所有可用命令及說明
2. **Given** 已安裝 prospec，**When** 執行 `prospec --version`，**Then** 顯示版本號
3. **Given** 輸入錯誤命令，**When** 執行 `prospec xyz`，**Then** 顯示錯誤訊息並建議相近命令
4. **Given** 合法的 `.prospec.yaml`，**When** 載入設定，**Then** 成功解析所有欄位
5. **Given** `.prospec.yaml` 缺少 `project.name` 欄位，**When** 載入設定，**Then** 顯示「project.name 為必填欄位」
6. **Given** `.prospec.yaml` 含不明欄位，**When** 載入設定，**Then** 警告但不阻擋
7. **Given** 任意命令加上 `--verbose`，**When** 執行，**Then** 輸出每個步驟的詳細資訊
8. **Given** 不加 `--verbose`，**When** 執行，**Then** 只輸出結果摘要

---

### User Story 1 - 初始化新專案 (Priority: P1)

開發者想要在新專案中導入 Prospec，透過 `prospec init` 命令快速建立標準化的專案結構，包含設定檔、AI Knowledge 目錄和 Constitution 模板，並自動偵測技術棧和已安裝的 AI CLI。

**Why this priority**: 這是所有其他功能的基礎，沒有初始化就無法使用任何其他 Prospec 功能。是 Greenfield 和 Brownfield 專案的共同入口點。

**Independent Test**: 可以在空目錄執行 `prospec init`，驗證所有必要檔案和目錄是否正確建立，且 `.prospec.yaml` 包含有效配置。

**Acceptance Scenarios**:

1. **Given** 一個空的專案目錄，**When** 執行 `prospec init`，**Then** 系統建立 `.prospec.yaml`、`AGENTS.md`、`docs/ai-knowledge/` 結構（含 `_index.md` 和 `_conventions.md`）、`docs/CONSTITUTION.md` 和 `docs/specs/`（含 `.gitkeep`）目錄
2. **Given** 執行 `prospec init --name my-project`，**When** 初始化完成，**Then** `.prospec.yaml` 中的 `project.name` 設定為 "my-project"
3. **Given** 不指定 `--name`，**When** 執行 `prospec init`，**Then** 使用目錄名稱作為專案名稱
4. **Given** 目錄中已存在 `.prospec.yaml`，**When** 執行 `prospec init`，**Then** 系統顯示警告訊息並退出，不修改任何現有檔案
5. **Given** 專案有 `package.json`，**When** 執行 `prospec init`，**Then** 自動偵測為 TypeScript/Node 並寫入 `tech_stack`
6. **Given** 專案有 `requirements.txt` 或 `pyproject.toml`，**When** 執行 `prospec init`，**Then** 自動偵測為 Python
7. **Given** 無法辨識的專案類型，**When** 執行 `prospec init`，**Then** `tech_stack` 留空，不阻擋初始化
8. **Given** 系統偵測到已安裝的 AI CLI（`~/.claude`、`~/.gemini`、`~/.copilot`、`~/.codex`），**When** 執行 `prospec init`，**Then** 顯示偵測結果並以互動式 checkbox 讓使用者選擇要啟用的 AI Assistant（預設勾選已偵測到的）
9. **Given** 互動式選擇畫面，**When** 使用者取消勾選某個已偵測到的 AI CLI，**Then** `.prospec.yaml` 的 `agents` 不包含該 CLI
10. **Given** 互動式選擇畫面，**When** 使用者勾選未安裝的 AI CLI，**Then** 系統提醒該 CLI 尚未安裝，但仍允許加入配置
11. **Given** AI Assistant 選擇完成，**When** 寫入設定，**Then** `.prospec.yaml` 的 `agents` 欄位記錄使用者選擇的 AI CLI 清單
12. **Given** AI Assistant 選擇完成，**When** 輸出摘要，**Then** 建議執行 `prospec agent sync`

---

### User Story 2 - 分析現有專案架構 (Priority: P1)

技術負責人想要將 Prospec 導入現有的 Brownfield 專案，透過 `prospec steering` 命令自動掃描並理解專案的架構模式、技術棧和模組結構，生成架構分析報告和模組關聯映射。

**Why this priority**: Brownfield 專案佔開發者使用場景的多數，53% 認為 legacy 不相容是最大挑戰。此功能消除手動分析的障礙。

**Independent Test**: 可以在已有程式碼的專案中執行 `prospec steering`，驗證系統正確識別技術棧並生成 `architecture.md` 和 `module-map.yaml`。

**Acceptance Scenarios**:

1. **Given** 已初始化的專案，**When** 執行 `prospec steering`，**Then** 遞迴掃描專案目錄並偵測架構層次（routes/services/models 等）
2. **Given** 未初始化的專案，**When** 執行 `prospec steering`，**Then** 提示先執行 `prospec init`
3. **Given** Python + FastAPI 專案，**When** 執行 `prospec steering`，**Then** 識別出 `language: python, framework: fastapi`
4. **Given** TypeScript + Clean Architecture 專案，**When** 執行 `prospec steering`，**Then** 識別出 `architecture: clean-architecture` 並映射 `cli/`、`core/`、`adapters/`、`types/` 層次
5. **Given** 掃描完成，**When** 更新設定，**Then** `.prospec.yaml` 的 `tech_stack` 和 `paths` 自動更新
6. **Given** 掃描完成，**When** 生成報告，**Then** 建立 `docs/ai-knowledge/architecture.md` 包含技術棧、目錄結構、架構層次、進入點
7. **Given** 掃描完成，**When** 生成映射，**Then** 建立 `docs/ai-knowledge/module-map.yaml`
8. **Given** 模組分散在不同目錄（如 lesson 的 routes/services/models），**When** 生成映射，**Then** 它們被歸類到同一個模組
9. **Given** 模組之間有依賴，**When** 生成映射，**Then** `relationships.depends_on` 和 `used_by` 正確標示
10. **Given** 每個模組，**When** 生成映射，**Then** 包含 `keywords` 欄位供後續關鍵字比對
11. **Given** 執行 `prospec steering --dry-run`，**When** 掃描完成，**Then** 只輸出預覽，不寫入檔案

---

### User Story 3 - 生成 AI Knowledge (Priority: P2)

開發者想要為專案生成 AI 可理解的知識文件，透過 `prospec knowledge generate` 掃描原始碼並為每個模組建立說明文件，更新模組索引表供 AI 按需查詢。

**Why this priority**: AI Knowledge 是實現 Progressive Disclosure（節省 70-80% token）的核心機制，但需要先有專案架構分析（User Story 2）才能有效運作。

**Independent Test**: 執行 `prospec knowledge generate` 後，驗證 `docs/ai-knowledge/modules/{module}/README.md` 為每個偵測到的模組生成，且 `_index.md` 包含完整的模組索引。

**Acceptance Scenarios**:

1. **Given** `.prospec.yaml` 定義了路徑模式，**When** 執行 `prospec knowledge generate`，**Then** 只掃描符合模式的檔案
2. **Given** 未定義路徑模式，**When** 執行 `prospec knowledge generate`，**Then** 使用預設掃描規則
3. **Given** `module-map.yaml` 存在，**When** 執行 `prospec knowledge generate`，**Then** 使用預定義的模組分類，保留 `keywords` 和 `relationships`
4. **Given** `module-map.yaml` 不存在，**When** 執行 `prospec knowledge generate`，**Then** 自動根據目錄結構偵測模組
5. **Given** 偵測到模組，**When** 生成知識，**Then** 在 `docs/ai-knowledge/modules/{module}/` 建立 README.md，包含模組概述、主要檔案、關鍵 API/函數
6. **Given** 生成完所有模組，**When** 更新索引，**Then** `_index.md` 包含所有模組的名稱、關鍵字、狀態、描述，以 Markdown 表格呈現
7. **Given** 模組有關聯關係，**When** 更新索引，**Then** 索引表反映模組關聯
8. **Given** `_index.md` 已存在，**When** 重新執行 `prospec knowledge generate`，**Then** 系統更新索引而非重複建立
9. **Given** 執行 `prospec knowledge generate --dry-run`，**When** 掃描完成，**Then** 只顯示將要建立的檔案清單而不實際建立

---

### User Story 4 - 同步 Agent 配置 (Priority: P2)

開發者想要將 Prospec 的知識與 Claude Code 等 AI 工具整合，透過 `prospec agent sync` 自動生成雙層配置：精簡的 Agent 配置檔（CLAUDE.md 等）和詳細的 SDD Skill，讓 AI 能透過 Progressive Disclosure 機制按需載入專案知識。

**Why this priority**: 這是 Prospec 與 AI 工具整合的橋樑。雙層設計避免 token 浪費：CLAUDE.md 精簡（不 import），SKILL 提供工作流程指引，AI Knowledge 按需讀取。需要先有 Knowledge（User Story 3）才有意義。

**Independent Test**: 執行 `prospec agent sync` 後，驗證：(1) 專案根目錄的 `CLAUDE.md` 存在且精簡；(2) `.claude/skills/prospec-*/SKILL.md` 存在且包含各 SDD 工作流程指引（MVP 7 個 Skills）。

**Acceptance Scenarios**:

1. **Given** `~/.claude` 存在，**When** 執行 `prospec agent sync`，**Then** 偵測到 Claude Code
2. **Given** 指定 `--cli claude`，**When** 執行，**Then** 只處理 Claude Code 配置
3. **Given** 沒有偵測到任何已安裝的 AI CLI，**When** 執行，**Then** 顯示支援的 CLI 清單並提示安裝方式
4. **Given** 已生成 AI Knowledge，**When** 執行 `prospec agent sync`，**Then** 在專案根目錄生成精簡的 `CLAUDE.md`，包含 AI Knowledge 位置指引和 Constitution 參考，不超過 100 行
5. **Given** 已生成 AI Knowledge，**When** 執行 `prospec agent sync`，**Then** 生成 7 個 `prospec-*` Skills（每個 Skill 一個目錄 + SKILL.md），涵蓋 MVP SDD 工作流：explore、new-story、plan、tasks、ff、implement、verify（archive 為 Phase 2）
6. **Given** 配置檔已存在，**When** 重新執行 `prospec agent sync`，**Then** 系統更新現有檔案而非重複建立
7. **Given** Skill 被觸發（如 `/prospec-plan`），**When** 使用者開始功能開發，**Then** AI 依 SKILL.md 指引先讀 `_index.md` 索引，再按需載入相關模組
8. **Given** 使用者執行 `/prospec-ff`，**When** Fast-forward Skill 被觸發，**Then** AI 依序呼叫 CLI 命令（`prospec change story` → `prospec change plan` → `prospec change tasks`）並填充所有 artifacts
9. **Given** Planning Skill 被觸發（`/prospec-new-story`、`/prospec-plan`、`/prospec-tasks`），**When** AI 填充 artifact 內容，**Then** AI 自動執行 Constitution 快速檢查（比對至少 3 條最相關的 Constitution 原則），以行內警告形式提示遺漏
10. **Given** 使用者執行 `/prospec-verify`，**When** 驗證 Skill 被觸發，**Then** AI 逐條比對所有 Constitution 原則，產出 Constitution Compliance Report（PASS/WARN/FAIL），FAIL 項目必須修正

---

### User Story 5 - 建立變更需求 (Priority: P3)

開發者想要追蹤和管理專案變更，透過 `prospec change story` 命令建立結構化的變更需求文件，自動識別相關模組，並生成元資料追蹤變更生命週期。

**Why this priority**: 變更管理是 SDD 的核心流程，但需要先有基礎設施（init、steering、knowledge）才能發揮完整價值。

**Independent Test**: 執行 `prospec change story add-feature` 後，驗證系統建立變更目錄結構 `.prospec/changes/{change-name}/`，包含 `proposal.md` 和 `metadata.yaml`。

**Acceptance Scenarios**:

1. **Given** 專案已初始化，**When** 執行 `prospec change story add-auth --description "新增使用者認證功能"`，**Then** 系統建立 `.prospec/changes/add-auth/` 目錄及 `proposal.md`、`metadata.yaml`
2. **Given** 變更目錄已存在，**When** 再次執行相同 change story，**Then** 提示變更已存在
3. **Given** 執行 change story，**When** 生成完成，**Then** `proposal.md` 包含 User Story 格式（As a / I want / So that）和驗收標準區域
4. **Given** 指定 `--description "Fix login timeout"`，**When** 生成完成，**Then** description 寫入 proposal.md 的 Notes 區域
5. **Given** 變更名稱 `add-lesson-insight`，**When** 比對 `_index.md` 關鍵字，**Then** 識別出相關模組並列入 proposal.md 的 Related Modules 區域
6. **Given** 執行 change story，**When** 生成完成，**Then** `metadata.yaml` 包含 `name`、`created_at`、`status: story` 和關聯模組

---

### User Story 6 - 生成實作計劃 (Priority: P3)

開發者想要基於變更需求生成具體的實作計劃，透過 `prospec change plan` 命令自動載入 proposal 和相關模組的 AI Knowledge context，產生包含 Patch Spec 的計劃文件。

**Why this priority**: 計劃生成依賴於 story（User Story 5）和 AI Knowledge（User Story 3），是變更流程的中間環節。

**Independent Test**: 在有 `proposal.md` 的變更目錄中執行 `prospec change plan`，驗證系統生成 `plan.md` 且包含相關模組的 context 資訊。

**Acceptance Scenarios**:

1. **Given** 有效的 proposal.md，**When** 執行 `prospec change plan`，**Then** 讀取 proposal 中的需求和相關模組
2. **Given** proposal 中標記了相關模組，**When** 載入 context，**Then** 讀取對應的 `docs/ai-knowledge/modules/{module}/README.md`
3. **Given** Constitution 存在，**When** 生成計劃，**Then** Constitution 作為 context 注入
4. **Given** 載入完 context，**When** 生成計劃，**Then** `plan.md` 包含概述、受影響模組、實作步驟、風險考量，且步驟與專案架構風格一致
5. **Given** 生成計劃，**When** 完成，**Then** 同時建立 `delta-spec.md`（Patch Spec），使用 ADDED/MODIFIED/REMOVED 格式，REQ ID 遵循 `REQ-{MODULE}-{NUMBER}` 格式
6. **Given** 執行 `prospec change plan --change add-auth`，**When** 計劃生成完成，**Then** 計劃包含 authentication 相關模組的 AI Knowledge context
7. **Given** 計劃生成完成，**When** 更新 metadata，**Then** `metadata.yaml` 的 `status` 更新為 `plan`

---

### User Story 7 - 拆分任務清單 (Priority: P3)

開發者想要將實作計劃拆分為可執行的任務清單，透過 `prospec change tasks` 命令依架構層次生成任務，使用 checkbox 格式方便追蹤進度。

**Why this priority**: 任務拆分是變更流程的最後一步，依賴於計劃（User Story 6），將計劃轉化為可執行的開發任務。

**Independent Test**: 在有 `plan.md` 的變更目錄中執行 `prospec change tasks`，驗證系統生成 `tasks.md` 且任務按架構層次排序。

**Acceptance Scenarios**:

1. **Given** 有效的 `plan.md`，**When** 執行 `prospec change tasks`，**Then** 系統生成 `tasks.md`
2. **Given** tasks.md 內容，**When** 查看，**Then** 任務按架構層次分組（Models → Services → Routes → Tests）
3. **Given** 每個任務，**When** 生成 tasks.md，**Then** 包含 `~{lines} lines` 複雜度估算
4. **Given** tasks.md 格式，**When** 查看，**Then** 每個任務以 `- [ ]` checkbox 開頭
5. **Given** 任務描述，**When** 查看，**Then** 每個任務包含具體的實作內容（不是模糊描述）
6. **Given** tasks.md 摘要，**When** 查看，**Then** 顯示總任務數和總估算行數
7. **Given** 任務間存在可並行關係，**When** 生成 tasks.md，**Then** 可並行的任務標記 `[P]` 並在摘要中顯示可並行任務數

---

### Edge Cases

- 在非專案目錄（無程式碼）執行 `prospec steering` 時？系統應提示找不到可分析的程式碼結構
- 未初始化的專案執行 `prospec steering` 時？系統應提示先執行 `prospec init`
- 執行 `prospec change plan` 但找不到對應的 story 時？系統應提示先建立 story
- `prospec agent sync` 偵測不到任何已安裝的 AI CLI 時？系統應列出支援的 CLI 並提示安裝方式
- `.prospec.yaml` 配置格式錯誤時？系統應提供具體的錯誤位置和修正建議
- `.prospec.yaml` 含不明欄位時？系統應警告但不阻擋執行
- 專案使用不支援的架構模式時？系統應允許手動配置 `paths` 模式
- `prospec agent sync` 寫入失敗時（磁碟空間不足、權限不足）？系統使用原子寫入，失敗時保留原檔案並顯示具體錯誤訊息
- 執行 `prospec init` 但已存在 `.prospec.yaml` 時？系統顯示警告並退出，不修改現有檔案
- 變更目錄已存在時執行相同 `change story`？系統應提示變更已存在
- 輸入錯誤命令時？系統應顯示錯誤訊息並建議相近命令

## Requirements *(mandatory)*

### Functional Requirements

#### CLI 基礎建設（F0: CLI Infrastructure）

- **REQ-CLI-001**: 所有命令 MUST 提供 `--help` 說明
- **REQ-CLI-002**: 所有命令 MUST 提供有意義的錯誤訊息
- **REQ-CLI-003**: 所有命令 MUST 支援 `--verbose` 除錯模式
- **REQ-CLI-004**: 命令結構 MUST 遵循 `prospec <command>` 或 `prospec <resource> <action>` 模式（單一動作命令如 `init`、`steering` 使用前者；多動作資源如 `change story/plan/tasks`、`agent sync`、`knowledge generate` 使用後者）
- **REQ-CLI-005**: 系統 MUST 支援 `prospec --version` 顯示版本號
- **REQ-CLI-006**: 系統 MUST 在輸入錯誤命令時建議相近命令
- **REQ-CLI-007**: `.prospec.yaml` MUST 有明確的 schema 定義和驗證
- **REQ-CLI-008**: schema 驗證 MUST 在缺少必填欄位時提供具體的錯誤訊息
- **REQ-CLI-009**: schema 驗證 MUST 在遇到不明欄位時警告但不阻擋

#### 初始化（F1: prospec init）

- **REQ-INIT-001**: 系統 MUST 建立 `.prospec.yaml` 配置檔，包含專案名稱、路徑和預設配置
- **REQ-INIT-002**: 系統 MUST 建立 `docs/ai-knowledge/` 目錄結構，含 `_index.md` 和 `_conventions.md`
- **REQ-INIT-003**: 系統 MUST 建立 `docs/CONSTITUTION.md` 模板檔案
- **REQ-INIT-004**: 系統 MUST 建立 `AGENTS.md` 通用 agent 指令檔
- **REQ-INIT-005**: 系統 MUST 自動偵測已安裝的 AI CLI（Claude Code via `~/.claude`、Gemini CLI via `~/.gemini`、GitHub Copilot CLI via `~/.copilot`、Codex CLI via `~/.codex`），並以互動式 checkbox 讓使用者選擇要啟用的 AI Assistant（預設勾選已偵測到的）
- **REQ-INIT-010**: 使用者選擇的 AI Assistant 清單 MUST 記錄在 `.prospec.yaml` 的 `agents` 欄位
- **REQ-INIT-006**: 使用者 MUST 能透過 `--name` 參數指定專案名稱；未指定時使用目錄名稱
- **REQ-INIT-007**: 系統 MUST 自動偵測專案技術棧（`package.json` → TypeScript/Node、`requirements.txt`/`pyproject.toml` → Python）
- **REQ-INIT-008**: 無法辨識技術棧時 `tech_stack` MUST 留空，不阻擋初始化
- **REQ-INIT-009**: `.prospec.yaml` 已存在時系統 MUST 顯示警告並退出，不修改現有檔案

#### 架構分析（F2: prospec steering）

- **REQ-STEER-001**: 系統 MUST 掃描專案目錄結構，偵測架構層次（如 Clean Architecture、MVC 等）
- **REQ-STEER-002**: 系統 MUST 識別技術棧（程式語言、框架、套件管理工具）
- **REQ-STEER-003**: 系統 MUST 生成 `docs/ai-knowledge/architecture.md` 架構分析報告，包含技術棧、目錄結構、架構層次、進入點
- **REQ-STEER-004**: 系統 MUST 更新 `.prospec.yaml` 的 `tech_stack` 和 `paths` 配置
- **REQ-STEER-005**: 系統 MUST 建立 `docs/ai-knowledge/module-map.yaml` 模組關聯映射，含 `depends_on`、`used_by`、`keywords` 欄位
- **REQ-STEER-006**: 系統 MUST 支援 `--dry-run` 預覽模式
- **REQ-STEER-007**: 使用者 MUST 能透過 `--depth` 參數控制掃描深度
- **REQ-STEER-008**: 系統 MUST 預設排除敏感檔案模式（`*.env*`、`*credential*`、`*secret*`），可透過 `.prospec.yaml` 的 `exclude` 配置自訂
- **REQ-STEER-009**: 未初始化的專案執行 steering 時系統 MUST 提示先執行 `prospec init`
- **REQ-STEER-010**: 分散在不同目錄的相關檔案（如 lesson 的 routes/services/models）MUST 被歸類到同一個模組

#### 知識生成（F3: prospec knowledge generate）

- **REQ-KNOW-001**: 系統 MUST 讀取 `.prospec.yaml` 取得路徑模式；未定義時使用預設掃描規則
- **REQ-KNOW-002**: 系統 MUST 掃描符合模式的原始碼檔案
- **REQ-KNOW-003**: 系統 MUST 優先使用 `module-map.yaml` 的模組映射（如存在），保留 `keywords` 和 `relationships`；否則自動識別
- **REQ-KNOW-004**: 系統 MUST 為每個模組在 `docs/ai-knowledge/modules/{module}/` 生成 README.md，包含模組概述、主要檔案、關鍵 API/函數
- **REQ-KNOW-005**: 系統 MUST 更新 `docs/ai-knowledge/_index.md` 模組索引，以 Markdown 表格呈現，含模組名稱、關鍵字、狀態、描述和模組關聯
- **REQ-KNOW-006**: 系統 MUST 支援 `--dry-run` 預覽模式
- **REQ-KNOW-007**: 系統 MUST 預設排除敏感檔案模式（`*.env*`、`*credential*`、`*secret*`），可透過 `.prospec.yaml` 的 `exclude` 配置自訂
- **REQ-KNOW-008**: 重新執行時系統 MUST 更新索引而非重複建立

#### Agent 同步（F4: prospec agent sync）

- **REQ-AGNT-001**: 系統 MUST 讀取 `.prospec.yaml` 取得專案名稱和啟用的 agent
- **REQ-AGNT-002**: 系統 MUST 自動偵測已安裝的 AI CLI（檢查 `~/.claude`、`~/.gemini`、`~/.copilot`、`~/.codex`）
- **REQ-AGNT-003**: 系統 MUST 生成精簡的 `CLAUDE.md` 於專案根目錄（不使用 @import，避免 token 浪費），包含 AI Knowledge 位置指引和 Constitution 參考，不超過 100 行
- **REQ-AGNT-004**: 系統 MUST 生成 7 個 `prospec-*` Skills（explore、new-story、plan、tasks、ff、implement、verify），每個 Skill 一個目錄含 SKILL.md，部分含 references/ 子目錄（archive Skill 為 Phase 2）
- **REQ-AGNT-005**: 每個 SKILL.md MUST 指導 AI 按需讀取 AI Knowledge（先讀 `_index.md`，再讀相關模組）
- **REQ-AGNT-009**: Skill 命名 MUST 遵循 `prospec-*` 慣例
- **REQ-AGNT-010**: Skill MUST 採用三層 Progressive Disclosure（Layer 1: name+description ~100 tokens，Layer 2: SKILL.md body < 500 行，Layer 3: references/ 按需讀取）
- **REQ-AGNT-011**: Skill 模板 MUST 從 `src/templates/skills/*.hbs` 生成（Single Source of Truth），注入專案 context
- **REQ-AGNT-012**: Planning 類 Skills（new-story、plan、tasks、ff）MUST 呼叫對應的 CLI 命令建立骨架，再由 AI 填充內容
- **REQ-AGNT-006**: 使用者 MUST 能透過 `--cli` 參數指定特定 CLI
- **REQ-AGNT-007**: 系統 MUST 使用原子寫入策略（暫存檔 → 重命名），寫入失敗時保留原檔案並回報錯誤
- **REQ-AGNT-008**: 配置檔已存在時系統 MUST 更新而非重複建立

#### 變更管理（F5-F7: prospec change）

- **REQ-CHNG-001**: 系統 MUST 透過 `change story` 建立變更目錄結構 `.prospec/changes/{change-name}/`
- **REQ-CHNG-002**: 系統 MUST 生成 `proposal.md`，包含 User Story 格式（As a / I want / So that）和驗收標準區域
- **REQ-CHNG-003**: 系統 MUST 自動識別相關模組（依 `_index.md` 關鍵字匹配）並列入 proposal.md 的 Related Modules 區域
- **REQ-CHNG-004**: 系統 MUST 生成 `metadata.yaml` 變更元資料，包含 `name`、`created_at`、`status`、關聯模組
- **REQ-CHNG-005**: 變更目錄已存在時系統 MUST 提示變更已存在
- **REQ-CHNG-006**: 系統 MUST 透過 `change plan` 讀取 `proposal.md` 取得需求
- **REQ-CHNG-007**: 系統 MUST 識別相關 AI Knowledge 模組並載入對應的 `modules/{module}/README.md`
- **REQ-CHNG-008**: 系統 MUST 載入 Constitution 作為 context 注入計劃生成
- **REQ-CHNG-009**: 系統 MUST 生成 `plan.md` 實作計劃，包含概述、受影響模組、實作步驟、風險考量
- **REQ-CHNG-010**: 系統 MUST 生成 `delta-spec.md`（Patch Spec），使用 ADDED/MODIFIED/REMOVED 格式，REQ ID 遵循 `REQ-{MODULE}-{NUMBER}` 格式
- **REQ-CHNG-011**: 系統 MUST 透過 `change tasks` 讀取 `plan.md`
- **REQ-CHNG-012**: 系統 MUST 依架構層次拆分任務（Models → Services → Routes → Tests）
- **REQ-CHNG-013**: 系統 MUST 估算每個任務的複雜度（以 `~{lines} lines` 表示）
- **REQ-CHNG-014**: 系統 MUST 生成 `tasks.md`，使用 `- [ ]` checkbox 格式，每個任務包含具體實作內容
- **REQ-CHNG-015**: tasks.md MUST 包含總任務數和總估算行數摘要
- **REQ-CHNG-016**: 計劃生成完成後 `metadata.yaml` 的 `status` MUST 更新為 `plan`

### Key Entities

- **ProspecConfig（`.prospec.yaml`）**: 專案配置，包含專案資訊、知識路徑、技術棧（`tech_stack`）、路徑模式（`paths`）、排除模式（`exclude`）和啟用的 AI Assistant 清單（`agents`，由 init 互動選擇決定）
- **ModuleMap（`docs/ai-knowledge/module-map.yaml`）**: 模組映射，記錄每個模組的路徑、依賴關係（`depends_on`、`used_by`）和關鍵字（`keywords`）
- **AIKnowledge**: AI 知識文件集合，位於 `docs/ai-knowledge/`，包含：
  - `_index.md`: 模組索引（Markdown 表格，含名稱、關鍵字、狀態、描述、關聯）
  - `_conventions.md`: 專案慣例
  - `architecture.md`: 架構分析（由 steering 生成，含技術棧、目錄結構、架構層次、進入點）
  - `modules/{module}/README.md`: 各模組說明文件（含模組概述、主要檔案、關鍵 API/函數）
- **ChangeStory**: 變更需求，位於 `.prospec/changes/{change-name}/`，包含：
  - `proposal.md`: 需求描述（User Story 格式 + 驗收標準 + Related Modules）
  - `plan.md`: 實作計劃（概述、受影響模組、實作步驟、風險考量）
  - `tasks.md`: 任務清單（checkbox 格式，按架構層次排序，含複雜度估算）
  - `metadata.yaml`: 變更元資料（name、created_at、status、關聯模組）
  - `delta-spec.md`: Patch Spec（ADDED/MODIFIED/REMOVED 格式）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 開發者可在 3 分鐘內完成新專案的 Prospec 初始化流程
- **SC-002**: `prospec steering` 可在 30 秒內完成中型專案（500 檔案以下）的架構分析
- **SC-003**: 系統支援同時處理 5 個以上的變更 story 而不產生混淆
- **SC-004**: 90% 的 Brownfield 專案可透過 steering 自動識別架構模式，無需手動配置
- **SC-005**: 使用 Prospec 生成的 AI Knowledge 可節省 70% 以上的 AI 對話 token 使用量
- **SC-006**: 首次使用的開發者可在 10 分鐘內理解並執行完整的 Greenfield 工作流程
- **SC-007**: Prospec 可用於自身開發（self-host），證明工具的實用性
- **SC-008**: 所有命令錯誤輸入時 100% 提供有意義的錯誤訊息或命令建議

## Clarifications

### Session 2026-02-03

- Q: 敏感資訊過濾策略？ → A: 模式匹配過濾（預設排除 `*.env*`、`*credential*`、`*secret*` 等模式，可透過 `.prospec.yaml` 自訂）
- Q: `prospec agent sync` 寫入失敗處理策略？ → A: 原子寫入 + 回滾（使用暫存檔寫入，成功後才重命名；失敗時保留原檔並報錯）
- Q: `prospec init` 的 AI Assistant 選擇機制？ → A: 偵測 + 互動選擇（先偵測已安裝的 CLI，再以互動式 checkbox 讓使用者勾選要啟用哪些，預設勾選已偵測到的）
- Q: MVP 支援的 AI Assistant 清單？ → A: Claude Code（`~/.claude`）、Gemini CLI（`~/.gemini`）、GitHub Copilot CLI（`~/.copilot`）、Codex CLI（`~/.codex`）

## Assumptions

- 使用者已安裝 Node.js 20+ 或 Bun runtime
- 使用者熟悉命令列操作
- 專案使用 Git 進行版本控制
- 目標 AI 工具支援 Markdown 格式的指令檔（Claude Code 的 CLAUDE.md、Gemini CLI 的 GEMINI.md、GitHub Copilot CLI 的 copilot-instructions.md、Codex CLI 的 AGENTS.md）
- 專案架構遵循常見模式（Clean Architecture、MVC、三層架構等）
- 未指定 `--name` 時，`prospec init` 使用當前目錄名稱作為專案名稱
- `proposal.md` 使用 User Story 格式（As a / I want / So that）
- `delta-spec.md` 使用 ADDED/MODIFIED/REMOVED 格式描述規格變更
- `tasks.md` 使用 `- [ ]` checkbox 格式，方便直接在檔案中標記進度
