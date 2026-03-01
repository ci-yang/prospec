# knowledge-engine — Capability Spec

## 概述

Knowledge Engine 能力管理 AI Knowledge：掃描專案產生原始資料、生成模組文件、維護模組索引，並在變更歸檔時增量更新知識。涵蓋 `prospec knowledge init`、`prospec knowledge generate`（AI Skill）和 `prospec knowledge update`（增量更新）。

**狀態**: Active
**最後更新**: 2026-02-15
**相關模組**: services (knowledge-init, knowledge, knowledge-update), lib (scanner, module-detector, detector), templates (knowledge, skills)

## 需求規格

### Knowledge Init（原始掃描）

### REQ-KNOW-001: 讀取路徑模式

依 `.prospec.yaml` 定義的路徑模式掃描原始碼。

**場景：**
- WHEN `.prospec.yaml` 定義了路徑模式，THEN 只掃描符合模式的檔案
- WHEN 未定義路徑模式，THEN 使用預設掃描規則

**新增來源**: mvp-initial (2026-02-04)

### REQ-KNOW-002: 掃描原始碼檔案

掃描符合模式的原始碼檔案，產生 raw-scan.md。

**場景：**
- WHEN 執行 `prospec knowledge init`，THEN 掃描原始碼並產生 raw-scan.md
- WHEN raw-scan.md 已存在，THEN 覆蓋更新

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: knowledge-redesign (2026-02-04) — 合併 steering 和 knowledge 掃描邏輯到 knowledge-init

### Knowledge Generate（AI 驅動模組切割）

### REQ-KNOW-003: 使用 Module Map 分類

優先使用 `module-map.yaml` 的預定義模組分類。

**場景：**
- WHEN module-map.yaml 存在，THEN 使用預定義的模組分類，保留 `keywords` 和 `relationships`
- WHEN module-map.yaml 不存在，THEN AI 自動根據 raw-scan.md 決定模組切割（business domain / tech layer / hybrid）

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: knowledge-redesign (2026-02-04) — AI 自主決定模組邊界

### REQ-KNOW-004: 生成模組 README

為每個模組生成 README.md，含概述、主要檔案、API 描述。

**場景：**
- WHEN 模組被偵測到，THEN 建立 `{base_dir}/ai-knowledge/modules/{name}/README.md`
- WHEN `--dry-run` 指定，THEN 只預覽輸出不寫入檔案
- WHEN README.md 已存在，THEN 使用 ContentMerger 保留 user section

**新增來源**: mvp-initial (2026-02-04)

### REQ-KNOW-005: 更新模組索引

維護 `_index.md`，含模組名稱、關鍵字、狀態、描述。

**場景：**
- WHEN 模組生成完成，THEN `_index.md` 反映所有模組
- WHEN 模組有 relationships，THEN 索引表反映依賴關係
- WHEN 重新執行 knowledge generate，THEN 更新索引而非重複建立

**新增來源**: mvp-initial (2026-02-04)

### REQ-KNOW-006: Dry-run 預覽模式

支援 `--dry-run` 預覽模式。

**場景：**
- WHEN 執行 `prospec knowledge generate --dry-run`，THEN 顯示將要建立的檔案清單而不實際建立

**新增來源**: mvp-initial (2026-02-04)

### REQ-KNOW-007: 敏感檔案排除

預設排除敏感檔案模式。

**場景：**
- WHEN 未自訂排除規則，THEN 預設排除 `*.env*`、`*credential*`、`*secret*`
- WHEN `.prospec.yaml` 定義 `exclude` 清單，THEN 使用自訂排除規則

**新增來源**: mvp-initial (2026-02-04)

### REQ-KNOW-008: 索引冪等更新

重新執行時更新索引而非重複建立。

**場景：**
- WHEN `_index.md` 已存在，THEN 更新 auto section 內容，保留 user section
- WHEN 模組目錄已存在，THEN 更新 README.md 而非重建

**新增來源**: mvp-initial (2026-02-04)

### Knowledge Update（增量更新）

### REQ-SERVICES-020: Delta Spec 解析器

解析 delta-spec.md 的 ADDED/MODIFIED/REMOVED 區段，識別受影響模組。

**場景：**
- WHEN delta-spec.md 包含 REQ IDs，THEN 從 `REQ-{MODULE}-{NNN}` 格式提取模組名稱
- WHEN ADDED 區段有新需求，THEN 識別需要新文件的模組
- WHEN delta-spec 為空或格式不正確，THEN 不拋錯，回傳空結構

**新增來源**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-021: 增量模組更新

只更新受影響模組的文件，不全量重新生成。

**場景：**
- WHEN 模組受 ADDED 影響，THEN 建立或更新模組 README.md
- WHEN 模組受 REMOVED 影響，THEN 標記模組為 deprecated（不刪除）
- WHEN 模組不存在，THEN 建立新目錄和 README.md
- WHEN 更新 README.md，THEN 使用 ContentMerger 保留 user section

**新增來源**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-022: 索引和 Module Map 更新

增量更新 `_index.md` 和 `module-map.yaml`。

**場景：**
- WHEN 模組被更新，THEN `_index.md` 反映最新狀態
- WHEN 新模組被新增，THEN module-map.yaml 包含新條目
- WHEN module-map.yaml 不存在，THEN 優雅地跳過

**新增來源**: add-knowledge-update (2026-02-09)

### REQ-SERVICES-023: Knowledge Update 協調器

執行完整的增量更新流程：解析 delta-spec → 掃描模組 → 更新 Knowledge。

**場景：**
- WHEN 提供 deltaSpecPath，THEN 自動解析並識別受影響模組
- WHEN 提供 manualModules，THEN 只更新指定模組的 README
- WHEN 從 archive 觸發，THEN 失敗為非致命性錯誤
- WHEN 更新完成，THEN 回傳 updated/created/deprecated 模組清單

**新增來源**: add-knowledge-update (2026-02-09)

## 邊界案例

- 無 delta-spec.md 可用：允許手動指定模組
- 模組 README 有 user-maintained sections：更新時保留 user section
- Knowledge update 在 archive 過程中失敗：非致命性，建議手動執行
- raw-scan.md 內容過大（巨型專案）：掃描時限制檔案數量（max 20 per module）

## 成功指標

- **SC-001**: 增量更新只處理受影響模組（不全量重新生成）
- **SC-002**: `_index.md` 和 `module-map.yaml` 與模組目錄保持一致
- **SC-005**: 使用 AI Knowledge 可節省 70% 以上的 AI 對話 token 使用量

## 變更歷史

| 日期 | 變更 | 影響 | REQs |
|------|------|------|------|
| 2026-02-04 | mvp-initial | 建立知識生成管線 | REQ-KNOW-001~008 |
| 2026-02-04 | knowledge-redesign | AI 驅動模組切割，合併 steering+knowledge 掃描 | REQ-KNOW-002~005 |
| 2026-02-09 | add-knowledge-update | 增量 delta-spec 驅動更新 | REQ-SERVICES-020~023 |
