# project-init — Capability Spec

## 概述

專案初始化能力處理首次專案設定和架構分析：建立 `.prospec.yaml`、scaffolding 目錄結構、偵測技術棧、設定 base directory、掃描現有專案架構並生成模組映射。涵蓋 `prospec init` 和 `prospec steering` 兩個命令。

**狀態**: Active
**最後更新**: 2026-02-15
**相關模組**: services (init, steering), cli (init, steering), lib (config, detector, scanner, module-detector), types (config)

## 需求規格

### 初始化（prospec init）

### REQ-INIT-001: 建立專案結構

執行 `prospec init` 時建立所有必要的檔案和目錄。

**場景：**
- WHEN 在空目錄執行 `prospec init`，THEN 建立 `.prospec.yaml`、`AGENTS.md`、`{base_dir}/ai-knowledge/`（含 `_index.md` 和 `_conventions.md`）、`{base_dir}/CONSTITUTION.md`、`{base_dir}/specs/`（含 `.gitkeep`）
- WHEN `.prospec.yaml` 已存在，THEN 顯示警告並退出，不修改任何現有檔案

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-002: 建立 AI Knowledge 目錄

建立 `{base_dir}/ai-knowledge/` 目錄結構，含 `_index.md` 和 `_conventions.md`。

**場景：**
- WHEN init 完成，THEN `{base_dir}/ai-knowledge/_index.md` 存在且包含空的模組表格
- WHEN init 完成，THEN `{base_dir}/ai-knowledge/_conventions.md` 存在且包含基礎模板

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-003: 建立 Constitution 模板

建立 `{base_dir}/CONSTITUTION.md` 模板檔案。

**場景：**
- WHEN init 完成，THEN `CONSTITUTION.md` 包含 Principles、Constraints、Quality Standards 區段模板
- WHEN 使用者後續編輯 Constitution，THEN 其他 Skill 能讀取並引用

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-004: 建立 AGENTS.md

建立 `AGENTS.md` 通用 agent 指令檔。

**場景：**
- WHEN init 完成，THEN 專案根目錄有 `AGENTS.md`
- WHEN agent sync 執行，THEN AGENTS.md 被更新為正確的指引

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-005: 偵測已安裝的 AI CLI

自動偵測系統上已安裝的 AI CLI 工具，以互動式 checkbox 讓使用者選擇。

**場景：**
- WHEN `~/.claude` 存在，THEN 偵測到 Claude Code 並預設勾選
- WHEN `~/.gemini` 存在，THEN 偵測到 Gemini CLI 並預設勾選
- WHEN `~/.copilot` 存在，THEN 偵測到 GitHub Copilot CLI 並預設勾選
- WHEN `~/.codex` 存在，THEN 偵測到 Codex CLI 並預設勾選
- WHEN 使用者取消勾選已偵測的 CLI，THEN `.prospec.yaml` 的 `agents` 不包含該 CLI
- WHEN 使用者勾選未安裝的 CLI，THEN 提醒尚未安裝但仍允許加入配置
- WHEN 偵測完成，THEN 建議執行 `prospec agent sync`

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-006: 可配置專案名稱

允許 `--name` 旗標覆蓋自動偵測的目錄名稱。

**場景：**
- WHEN 未指定 `--name`，THEN 使用目錄名稱作為專案名稱
- WHEN 指定 `--name my-project`，THEN `.prospec.yaml` 的 `project.name` 設為 `my-project`

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-007: 自動偵測技術棧

自動偵測專案的程式語言、框架和套件管理工具。

**場景：**
- WHEN 專案有 `package.json`，THEN 偵測為 TypeScript/Node 並寫入 `tech_stack`
- WHEN 專案有 `requirements.txt` 或 `pyproject.toml`，THEN 偵測為 Python
- WHEN 無法辨識的專案類型，THEN `tech_stack` 留空，不阻擋初始化

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-008: 技術棧偵測容錯

無法辨識技術棧時不阻擋初始化。

**場景：**
- WHEN 專案目錄無可辨識的標記檔案，THEN `tech_stack` 留空但 init 正常完成
- WHEN 後續執行 `prospec steering`，THEN 可補充偵測技術棧

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-009: 防止重複初始化

`.prospec.yaml` 已存在時顯示警告並退出。

**場景：**
- WHEN `.prospec.yaml` 已存在，THEN 顯示警告訊息並退出
- WHEN 強制重新初始化，THEN 不修改任何現有檔案

**新增來源**: mvp-initial (2026-02-04)

### REQ-INIT-010: 記錄 AI Assistant 選擇

使用者選擇的 AI Assistant 清單記錄在 `.prospec.yaml` 的 `agents` 欄位。

**場景：**
- WHEN AI Assistant 選擇完成，THEN `.prospec.yaml` 的 `agents` 欄位記錄選擇的清單
- WHEN 輸出摘要，THEN 建議執行 `prospec agent sync`

**新增來源**: mvp-initial (2026-02-04)

### 架構分析（prospec steering）

### REQ-STEER-001: 掃描專案架構

遞迴掃描專案目錄結構，偵測架構層次。

**場景：**
- WHEN 已初始化的專案執行 `prospec steering`，THEN 遞迴掃描並偵測架構層次（如 routes/services/models）
- WHEN 未初始化的專案執行 `prospec steering`，THEN 提示先執行 `prospec init`

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-002: 識別技術棧

識別專案的程式語言、框架和套件管理工具。

**場景：**
- WHEN Python + FastAPI 專案，THEN 識別出 `language: python, framework: fastapi`
- WHEN TypeScript + Clean Architecture 專案，THEN 識別出 `architecture: clean-architecture`

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-003: 生成架構分析報告

建立 `{base_dir}/ai-knowledge/architecture.md`。

**場景：**
- WHEN 掃描完成，THEN 建立 architecture.md 包含技術棧、目錄結構、架構層次、進入點

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-004: 更新設定檔

掃描結果回寫 `.prospec.yaml`。

**場景：**
- WHEN 掃描完成，THEN `.prospec.yaml` 的 `tech_stack` 和 `paths` 自動更新

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-005: 生成模組關聯映射

建立 `{base_dir}/ai-knowledge/module-map.yaml`。

**場景：**
- WHEN 掃描完成，THEN 建立 module-map.yaml 含 `depends_on`、`used_by`、`keywords`
- WHEN 模組分散在不同目錄，THEN 相關檔案被歸類到同一個模組
- WHEN 模組之間有依賴，THEN `relationships` 正確標示

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-006: Dry-run 預覽模式

支援 `--dry-run` 預覽模式。

**場景：**
- WHEN 執行 `prospec steering --dry-run`，THEN 只輸出預覽，不寫入檔案

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-007: 掃描深度控制

使用者可透過 `--depth` 參數控制掃描深度。

**場景：**
- WHEN 指定 `--depth 2`，THEN 只掃描到第 2 層目錄

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-008: 敏感檔案排除

預設排除敏感檔案模式，可透過 `.prospec.yaml` 的 `exclude` 自訂。

**場景：**
- WHEN 未自訂排除規則，THEN 預設排除 `*.env*`、`*credential*`、`*secret*`
- WHEN `.prospec.yaml` 定義 `exclude` 清單，THEN 使用自訂排除規則

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-009: 未初始化專案提示

未初始化的專案執行 steering 時提示先初始化。

**場景：**
- WHEN 未初始化的專案執行 `prospec steering`，THEN 顯示 PrerequisiteError 提示先執行 `prospec init`

**新增來源**: mvp-initial (2026-02-04)

### REQ-STEER-010: 跨目錄模組歸類

分散在不同目錄的相關檔案被歸類到同一個模組。

**場景：**
- WHEN lesson 的 routes/services/models 分散在不同目錄，THEN 歸類到同一個 lesson 模組
- WHEN 模組有 `keywords` 欄位，THEN 後續變更可透過關鍵字比對識別相關模組

**新增來源**: mvp-initial (2026-02-04)

### Base Directory 配置

### REQ-TYPES-020: 預設 Base Directory 常數

定義 `DEFAULT_BASE_DIR` 常數。

**場景：**
- WHEN base_dir 未配置，THEN 使用預設值
- WHEN base_dir 已配置在 `.prospec.yaml`，THEN 使用配置值
- WHEN 舊版 `.prospec.yaml` 無 base_dir，THEN 向下相容使用 `'docs'`

**新增來源**: configure-base-dir (2026-02-09)

### REQ-LIB-010: 集中式路徑解析

`resolveBasePaths()` 從 config 推導所有標準路徑。

**場景：**
- WHEN config 有 `paths.base_dir`，THEN 所有路徑從此推導（knowledgePath、constitutionPath、specsPath）
- WHEN config 無 `paths`，THEN 使用預設 base directory
- WHEN 任何 service 需要路徑，THEN 統一透過此函式取得（取代 7+ 個 inline fallback）

**新增來源**: configure-base-dir (2026-02-09)

### REQ-CLI-010: Init 互動式 Base Directory 選擇

`prospec init` 時互動式提示選擇 base directory。

**場景：**
- WHEN init 互動模式，THEN 在 agent 選擇後提示 "Prospec artifacts directory?"（預設 `prospec`）
- WHEN 非互動模式，THEN 使用預設 base directory
- WHEN 使用者輸入自訂名稱，THEN 寫入 `.prospec.yaml` 的 `paths.base_dir`

**新增來源**: configure-base-dir (2026-02-09)

## 邊界案例

- 在非專案目錄（無程式碼）執行 `prospec steering`：提示找不到可分析的程式碼結構
- 未初始化的專案執行 `prospec steering`：提示先執行 `prospec init`
- `.prospec.yaml` 配置格式錯誤（YAML 語法錯誤）：提供具體的錯誤位置和修正建議
- 專案使用不支援的架構模式：允許手動配置 `paths` 模式
- 重複執行 `prospec init`：警告並退出，不修改現有檔案
- 使用者勾選未安裝的 AI CLI：提醒但仍允許加入配置

## 成功指標

- **SC-001**: 新專案可在 3 分鐘內完成 Prospec 初始化流程
- **SC-002**: 所有 Prospec services 使用 `resolveBasePaths()` 解析路徑
- **SC-004**: 90% 的 Brownfield 專案可透過 steering 自動識別架構模式
- **SC-006**: 首次使用者可在 10 分鐘內理解並執行完整的 Greenfield 工作流程

## 變更歷史

| 日期 | 變更 | 影響 | REQs |
|------|------|------|------|
| 2026-02-04 | mvp-initial | 建立 init 工作流和 steering 架構分析 | REQ-INIT-001~010, REQ-STEER-001~010 |
| 2026-02-09 | configure-base-dir | 可配置的 base directory | REQ-TYPES-020, REQ-LIB-010, REQ-CLI-010 |
