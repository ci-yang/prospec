---
feature: ai-knowledge
status: active
last_updated: 2026-03-02
story_count: 6
req_count: 12
---

# AI Knowledge

## Who & Why

服務使用 Prospec 的開發者與 AI Agent。AI Knowledge 是結構化的專案記憶系統——透過掃描原始碼、AI 驅動的模組文件生成、增量更新機制，讓 AI Agent 快速載入精準的專案上下文，節省 70%+ token 消耗。這是 Prospec 的核心差異化能力。

## User Stories & Behavior Specifications

### US-300: 原始碼掃描與路徑模式 [P0]

身為一名開發者，
我想要 Prospec 根據設定的路徑模式掃描原始碼並產出 raw-scan.md，
以便 AI 能基於完整的原始碼快照來生成模組文件。

**Acceptance Scenarios:**
- WHEN 執行 `prospec knowledge init` THEN 產出 raw-scan.md
- WHEN `.prospec.yaml` 定義 path patterns THEN 只掃描符合模式的檔案

#### REQ-KNOW-001: Read Path Patterns
- WHEN `.prospec.yaml` defines path patterns, THEN only scan files matching patterns
- WHEN no path patterns defined, THEN use default scan rules

#### REQ-KNOW-002: Scan Source Code Files
- WHEN executing `prospec knowledge init`, THEN scan source code and produce raw-scan.md
- WHEN raw-scan.md already exists, THEN overwrite and update

#### REQ-KNOW-007: Sensitive File Exclusion
- WHEN no custom exclusion rules, THEN default exclude `*.env*`, `*credential*`, `*secret*`
- WHEN `.prospec.yaml` defines `exclude` list, THEN use custom exclusion rules

---

### US-301: AI 驅動模組偵測與分類 [P0]

身為一名開發者，
我想要 AI 自動偵測模組邊界或使用預定義的 module-map.yaml，
以便模組切割反映真實的專案架構。

**Acceptance Scenarios:**
- WHEN module-map.yaml 存在 THEN 優先使用預定義分類
- WHEN module-map.yaml 不存在 THEN AI 自動判斷模組邊界

#### REQ-KNOW-003: Use Module Map for Classification
- WHEN module-map.yaml exists, THEN use predefined classification, preserving `keywords` and `relationships`
- WHEN module-map.yaml doesn't exist, THEN AI auto-determines module boundaries from raw-scan.md

---

### US-302: 生成模組 README 文件 [P0]

身為一名開發者，
我想要每個模組自動產生結構化的 README.md，
以便 AI Agent 能快速理解模組的職責、API 和關鍵檔案。

**Acceptance Scenarios:**
- WHEN 模組偵測完成 THEN 產生 `ai-knowledge/modules/{name}/README.md`
- WHEN 使用 `--dry-run` THEN 預覽輸出但不寫入檔案
- WHEN README.md 已存在 THEN 使用 ContentMerger 保留使用者自訂區段

#### REQ-KNOW-004: Generate Module README
- WHEN module detected, THEN create `{base_dir}/ai-knowledge/modules/{name}/README.md`
- WHEN `--dry-run` specified, THEN preview output without writing files
- WHEN README.md already exists, THEN use ContentMerger to preserve user sections

#### REQ-KNOW-006: Dry-run Preview Mode
- WHEN executing `prospec knowledge generate --dry-run`, THEN display file list without creating

---

### US-303: 模組索引維護 [P0]

身為一名開發者，
我想要 `_index.md` 自動維護所有模組的名稱、關鍵字和描述，
以便 AI Agent 能從索引快速定位相關模組。

**Acceptance Scenarios:**
- WHEN 模組生成完成 THEN `_index.md` 反映所有模組
- WHEN 重新執行 knowledge generate THEN 更新索引而非重建

#### REQ-KNOW-005: Update Module Index
- WHEN module generation complete, THEN `_index.md` reflects all modules with dependencies
- WHEN re-executing knowledge generate, THEN update index rather than recreate

#### REQ-KNOW-008: Index Idempotent Update
- WHEN `_index.md` already exists, THEN update auto section, preserve user section
- WHEN module directory already exists, THEN update README.md rather than rebuild

---

### US-310: 增量 Knowledge 更新 [P0]

身為一名使用 Prospec 的開發者，
我想要在變更歸檔時自動增量更新 AI Knowledge，
以便模組文件與程式碼保持同步，無需全量重新生成。

**Acceptance Scenarios:**
- WHEN 變更歸檔完成 THEN 自動觸發增量更新
- WHEN delta-spec.md 存在 THEN 解析 ADDED/MODIFIED/REMOVED 識別受影響模組
- WHEN 更新完成 THEN 回傳 updated/created/deprecated 模組清單

#### REQ-SERVICES-020: Delta Spec Parser
- WHEN delta-spec.md contains REQ IDs, THEN extract module names from `REQ-{MODULE}-{NNN}` format
- WHEN delta-spec is empty or malformed, THEN return empty structure without error

#### REQ-SERVICES-021: Incremental Module Update
- WHEN module affected by ADDED, THEN create or update module README.md
- WHEN module affected by REMOVED, THEN mark as deprecated (don't delete)
- WHEN updating README.md, THEN use ContentMerger to preserve user sections

#### REQ-SERVICES-022: Index and Module Map Update
- WHEN module updated, THEN `_index.md` reflects latest state
- WHEN new module added, THEN module-map.yaml includes new entry
- WHEN module-map.yaml doesn't exist, THEN gracefully skip

#### REQ-SERVICES-023: Knowledge Update Coordinator
- WHEN deltaSpecPath provided, THEN auto-parse and identify affected modules
- WHEN manualModules provided, THEN only update specified module READMEs
- WHEN triggered from archive, THEN failure is non-fatal error

---

### US-320: Knowledge-SDD 鏈路品質閘門 [P1]

身為一名使用 Prospec 的開發者，
我想要每個 SDD 階段都有結構化的 Knowledge 載入機制和品質閘門，
以便 AI 產出更精準的 artifacts，Knowledge 價值在 SDD 鏈路中被充分利用。

**Acceptance Scenarios:**
- WHEN Planning Skill 觸發 THEN 顯示 Knowledge Quality Gate 表格
- WHEN Plan 階段偵測到 Brownfield 專案 THEN 產出 Technical Summary
- WHEN Verify 階段執行 THEN 檢查 Spec 與 Knowledge 的 staleness

#### REQ-TEMPLATES-040: Knowledge Quality Gate
- WHEN Planning Skill triggered, THEN display Knowledge Quality Gate table
- WHEN required Knowledge missing, THEN warn but don't block workflow

#### REQ-TEMPLATES-041: Plan Brownfield/Greenfield Detection
- WHEN AI Knowledge modules exist, THEN detect as Brownfield
- WHEN no AI Knowledge modules, THEN detect as Greenfield

#### REQ-TEMPLATES-045: Verify Spec-Knowledge Staleness Detection
- WHEN Spec updated after Knowledge, THEN warn staleness

---

## Edge Cases

- delta-spec.md 不存在：允許手動指定模組進行更新
- 模組 README 有使用者自訂區段：更新時保留 user section
- Knowledge 更新在 archive 期間失敗：non-fatal，建議手動執行
- raw-scan.md 過大（巨型專案）：限制每模組最多 20 個檔案
- module-map.yaml 不存在時執行增量更新：gracefully skip

## Success Criteria

- **SC-1**: 增量更新只處理受影響模組，不全量重新生成
- **SC-2**: `_index.md` 和 `module-map.yaml` 與模組目錄保持一致
- **SC-3**: AI Knowledge 節省 70%+ 的 AI 對話 token 消耗
- **SC-4**: Knowledge Quality Gate 覆蓋所有 5 個 Planning Skills

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
| 2026-02-04 | mvp-initial | 建立 Knowledge 生成管線 | US-300~303, REQ-KNOW-001~008 |
| 2026-02-04 | knowledge-redesign | AI 驅動模組邊界 | REQ-KNOW-002~005 |
| 2026-02-09 | add-knowledge-update | 增量 delta-spec 驅動更新 | US-310, REQ-SERVICES-020~023 |
| 2026-02-16 | enhance-knowledge-sdd-pipeline | Knowledge-SDD 品質閘門 | US-320, REQ-TEMPLATES-040~045 |
| 2026-03-02 | v2-product-first migration | 遷移至 feature spec 格式 | All |
