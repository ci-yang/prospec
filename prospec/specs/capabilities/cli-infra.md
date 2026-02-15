# cli-infra — Capability Spec

## 概述

CLI 基礎建設能力提供 prospec 的命令列框架、設定檔驗證、型別定義、錯誤處理和共用工具函式，是所有其他能力的底層依賴。

**狀態**: Active
**最後更新**: 2026-02-15
**相關模組**: cli (entry point), types (config, change, errors, skill), lib (fs-utils, yaml-utils, config)

## 需求規格

### REQ-CLI-001: CLI 進入點

提供 `prospec` 命令，含 `--help`、`--version` 和子命令路由。

**場景：**
- WHEN 執行 `prospec --help`，THEN 顯示所有可用命令及說明
- WHEN 執行 `prospec --version`，THEN 顯示版本號
- WHEN 輸入無效命令（如 `prospec xyz`），THEN 顯示錯誤訊息並建議相近命令

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-002: 有意義的錯誤訊息

所有命令必須提供有意義的錯誤訊息，幫助使用者理解問題和修正方向。

**場景：**
- WHEN 命令執行失敗，THEN 錯誤訊息包含問題描述和建議的修正步驟
- WHEN 遇到 ProspecError，THEN 顯示 error code + message + suggestion

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-003: Verbose 除錯模式

所有命令支援 `--verbose` 旗標，輸出每個步驟的詳細資訊。

**場景：**
- WHEN 加上 `--verbose`，THEN 輸出每個步驟的詳細資訊
- WHEN 不加 `--verbose`，THEN 只輸出結果摘要

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-004: 命令結構模式

命令結構遵循 `prospec <command>` 或 `prospec <resource> <action>` 模式。

**場景：**
- WHEN 單一動作命令（如 `init`），THEN 使用 `prospec <command>` 格式
- WHEN 多動作資源（如 change、knowledge），THEN 使用 `prospec <resource> <action>` 格式（如 `prospec change story`、`prospec knowledge generate`）

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-005: 版本號顯示

系統支援 `prospec --version` 顯示版本號。

**場景：**
- WHEN 執行 `prospec --version`，THEN 顯示從 package.json 讀取的版本號

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-006: 命令建議

輸入錯誤命令時系統建議相近的有效命令。

**場景：**
- WHEN 執行 `prospec inti`，THEN 建議 `prospec init`
- WHEN 輸入完全不相關的命令，THEN 顯示可用命令清單

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-007: 設定檔 Schema 定義

`.prospec.yaml` 有明確的 Zod schema 定義和驗證。

**場景：**
- WHEN `.prospec.yaml` 合法，THEN 成功解析所有欄位
- WHEN 載入設定，THEN 透過 Zod schema 驗證結構和型別

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-008: 設定檔必填欄位驗證

Schema 驗證在缺少必填欄位時提供具體的錯誤訊息。

**場景：**
- WHEN `.prospec.yaml` 缺少 `project.name`，THEN 顯示「project.name 為必填欄位」
- WHEN 缺少多個必填欄位，THEN 列出所有缺失欄位

**新增來源**: mvp-initial (2026-02-04)

### REQ-CLI-009: 不明欄位寬容處理

Schema 驗證在遇到不明欄位時警告但不阻擋。

**場景：**
- WHEN `.prospec.yaml` 含不明欄位，THEN 警告但不阻擋執行
- WHEN 不明欄位可能是拼寫錯誤，THEN 建議正確的欄位名稱

**新增來源**: mvp-initial (2026-02-04)

## 邊界案例

- `.prospec.yaml` 配置格式錯誤（YAML 語法錯誤）：提供具體的錯誤位置和修正建議
- 磁碟空間不足時寫入失敗：使用原子寫入，失敗時保留原檔案並顯示具體錯誤訊息
- 輸入錯誤命令：顯示錯誤訊息並建議相近命令
- `.prospec.yaml` 含不明欄位：警告但不阻擋

## 成功指標

- **SC-001**: 所有 CLI 命令可透過 `--help` 被發現
- **SC-002**: Config 驗證捕捉到格式錯誤的 `.prospec.yaml` 並提供可執行的修正訊息
- **SC-008**: 所有命令錯誤輸入時 100% 提供有意義的錯誤訊息或命令建議

## 變更歷史

| 日期 | 變更 | 影響 | REQs |
|------|------|------|------|
| 2026-02-04 | mvp-initial | 建立 CLI 框架和設定系統 | REQ-CLI-001~009 |
| 2026-02-09 | configure-base-dir | 新增 base_dir 到 config paths schema | REQ-CLI-008 |
