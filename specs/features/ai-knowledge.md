---
feature: ai-knowledge
status: active
last_updated: 2026-03-02
story_count: 3
req_count: 8
---

# AI Knowledge — 智慧知識引擎

## Who & Why

**服務對象**: AI Agent（Claude, Gemini, Copilot, Codex）以及使用 Prospec 的開發者

**解決問題**: AI Agent 需要快速理解專案結構才能有效工作，但原始碼太龐大、散落的文件太零碎

**為什麼重要**: AI Knowledge 是 Prospec 的核心差異化——自動生成、持久化、版控、跨工具、人機可讀、按需載入的六項組合，目前無競品完整實現

## User Stories & Behavior Specifications

### US-302: AI Knowledge 產出對 AI Agent 有實用價值 [P1]

As a AI Agent（使用 prospec 輔助開發）,
I want AI Knowledge 的模組文件告訴我「什麼時候要改這個模組、怎麼改、注意什麼」,
So that 我能在實作任務時快速獲得有用的上下文，而非只看到一堆 function 列表。

**Acceptance Scenarios:**
- WHEN AI Agent 讀取一個模組的 README 時，THEN 文件包含「修改指南」區塊
- WHEN AI Agent 需要了解模組間關係時，THEN 文件包含「連動修改」的指引
- WHEN AI Agent 遇到此模組的常見錯誤時，THEN 文件包含「常見陷阱」區塊

#### REQ-KNOW-010: Recipe-First Module README 格式
模組 README 必須包含三個 recipe 區塊：Modification Guide、Ripple Effects、Pitfalls。

**Scenarios:**
- WHEN 產出模組 README，THEN 包含 `## Modification Guide` 列出 2-5 個修改場景
- WHEN 產出模組 README，THEN 包含 `## Ripple Effects` 列出連動影響
- WHEN 產出模組 README，THEN 包含 `## Pitfalls` 列出 2-3 個常見錯誤

#### REQ-KNOW-004: Module README 生成格式
模組 README 結構為 Recipe-First：Overview → Key Files → Public API（簽名+1句話）→ Dependencies → Modification Guide → Ripple Effects → Pitfalls。模組目錄只包含 README.md。

**Scenarios:**
- WHEN 產出模組 README，THEN 結構遵循 Recipe-First 順序
- WHEN 產出模組 README，THEN 模組目錄只有 README.md（無 api-surface.md 等冗餘檔案）

---

### US-303: 模組切割邏輯透明可理解 [P2]

As a prospec 使用者（專案維護者）,
I want 理解 AI Knowledge 為什麼這樣切割模組,
So that 我能判斷模組切割是否合理，並在專案演進時調整。

**Acceptance Scenarios:**
- WHEN 查看 `_index.md` 時，THEN 每個模組有 1 句話說明切割理由
- WHEN `/prospec-knowledge-generate` 產出模組時，THEN 輸出包含切割決策的簡要說明

#### REQ-KNOW-012: 模組切割理由透明化
`_index.md` 的模組表格新增 Rationale 欄位。

**Scenarios:**
- WHEN 查看 _index.md，THEN 表格含 Rationale 欄位
- WHEN knowledge.service 產出 _index.md，THEN 自動推斷並填入切割理由

#### REQ-KNOW-005: Module Index 格式
_index.md 表格為 Module | Keywords | Status | Description | Rationale | Depends On。底部新增 Loading Rules。

**Scenarios:**
- WHEN 查看 _index.md，THEN 底部有 `## Loading Rules` 區塊
- WHEN 查看 _index.md，THEN 表格含 Rationale 欄位但不含 Files 欄位

#### REQ-KNOW-014: 彈性粒度策略
`.prospec.yaml` 支援 `knowledge.strategy` 欄位（auto/architecture/domain/package）。

**Scenarios:**
- WHEN .prospec.yaml 設定 strategy: domain，THEN module-detector 按業務領域切割
- WHEN strategy 為 auto，THEN 依序嘗試 package → domain → architecture 取最佳結果

---

### US-310: Knowledge 產出格式精簡高效 [P2]

As a prospec 使用者,
I want AI Knowledge 的產出格式精簡，聚焦高價值資訊,
So that 不會浪費 AI Agent 的 context window 在低價值的自動生成內容上。

**Acceptance Scenarios:**
- WHEN 產出模組 README 時，THEN 文件控制在 100 行以內
- WHEN 文件包含 API surface 時，THEN 只列出 public API 簽名和 1 句話用途

#### REQ-KNOW-011: Module README Token 預算
每個模組 README 行數上限 100 行，token 預算 ≤400 tokens。

**Scenarios:**
- WHEN knowledge.service 產出 README，THEN ≤ 100 行
- WHEN 模組目錄被掃描，THEN 只包含 README.md

#### REQ-KNOW-013: L0/L1/L2 分層載入架構
AI Knowledge 採用三層載入架構：L0（≤1,500 tokens, always）→ L1（≤400 tokens/module, on demand）→ L2（unlimited, source code）。

**Scenarios:**
- WHEN _index.md 被生成，THEN 底部包含 Loading Rules 區塊
- WHEN Skill templates 引用 Knowledge，THEN Loading Strategy 與 L0/L1/L2 定義一致

#### REQ-KNOW-006: Dry-run Preview Mode
`--dry-run` 顯示將產出的檔案列表，含預估行數和 token 數。

**Scenarios:**
- WHEN 使用者執行 --dry-run，THEN 顯示每個檔案的預估行數
- WHEN 使用者執行 --dry-run，THEN 顯示 L0/L1 token 合計

---

## Edge Cases

- **極小型專案**（1-2 模組）：模組化可能增加負擔——最低模組數閾值為 2
- **快速演進專案**：頻繁修改時 Knowledge 容易過時——需過期檢測機制
- **模組切割爭議**：自動切割可能不符合維護者認知——user section 允許手動調整

## Success Criteria

- **SC-001**: 模組 README 行數 ≤ 100 行
- **SC-002**: 每個模組 README 包含 Modification Guide 和 Pitfalls
- **SC-003**: AI Agent 僅靠 AI Knowledge 能正確回答「新增 X 功能要改哪些模組」
- **SC-004**: `_index.md` 的模組表格包含切割理由

## Maintenance Rules

1. **Replace-in-Place**: MODIFIED User Stories and REQs directly replace existing versions
2. **Functional Grouping**: New requirements insert under the corresponding User Story
3. **No Inline Provenance**: Historical attribution only in Change History table
4. **Deprecation over Deletion**: Removed requirements move to Deprecated section

## Deprecated Requirements

_(None)_

## Change History

| Date | Change | Impact | Stories/REQs |
|------|--------|--------|-------------|
| 2026-03-02 | optimize-ai-knowledge | Recipe-First 格式重設計 + L0/L1/L2 分層 + 彈性粒度策略 | US-302, US-303, US-310, REQ-KNOW-004~006, REQ-KNOW-010~014 |
