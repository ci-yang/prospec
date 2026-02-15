# change-workflow — Capability Spec

## 概述

Change Workflow 能力管理完整的 SDD 生命週期：建立 proposals（story）、生成實作計劃（plan）、拆解任務（tasks）、實作、驗證，以及歸檔已完成的變更。也涵蓋 proposal 格式定義、capability spec 格式、規格同步和規格-知識一致性驗證。

**狀態**: Active
**最後更新**: 2026-02-16
**相關模組**: services (archive, change-story, change-plan, change-tasks), templates (skills, references), types (change)

## 需求規格

### 建立變更需求（prospec change story）

### REQ-CHNG-001: 建立變更目錄

透過 `change story` 建立變更目錄結構 `.prospec/changes/{name}/`。

**場景：**
- WHEN 執行 `prospec change story add-auth --description "新增使用者認證功能"`，THEN 建立 `.prospec/changes/add-auth/` 目錄及 `proposal.md`、`metadata.yaml`
- WHEN 變更目錄已存在，THEN 提示變更已存在

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-002: 生成 proposal.md

生成 proposal.md，包含 INVEST User Story 格式和驗收標準。

**場景：**
- WHEN change story 完成，THEN proposal.md 包含多個 INVEST User Stories（作為/我希望/以便 + Priority + WHEN/THEN 驗收場景）
- WHEN `--description` 提供，THEN description 寫入 proposal.md 的 Notes 區域
- WHEN 引用 proposal-format reference，THEN 產出包含 Why、User Stories、邊界案例、功能需求、成功指標、待釐清標記

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: redesign-spec-system (2026-02-15) — 升級為 INVEST 格式 + WHEN/THEN

### REQ-CHNG-003: 自動識別相關模組

依 `_index.md` 關鍵字匹配識別相關模組。

**場景：**
- WHEN 變更名稱包含模組關鍵字，THEN Related Modules 區域列出匹配的模組
- WHEN 無關鍵字匹配，THEN Related Modules 區域為空

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-004: 變更元資料生命週期

透過 metadata.yaml 追蹤變更狀態。

**場景：**
- WHEN change story 建立，THEN metadata.yaml 有 `status: story`
- WHEN plan 生成，THEN status 更新為 `plan`
- WHEN tasks 生成，THEN status 更新為 `tasks`
- WHEN 驗證完成，THEN status 更新為 `verified`
- WHEN 歸檔完成，THEN status 更新為 `archived`

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: add-archive-system (2026-02-09) — 新增 `archived` 狀態

### REQ-CHNG-005: 防止重複變更

變更目錄已存在時提示。

**場景：**
- WHEN 變更名稱已存在於 `.prospec/changes/`，THEN 提示變更已存在並退出

**新增來源**: mvp-initial (2026-02-04)

### 生成實作計劃（prospec change plan）

### REQ-CHNG-006: 載入 Proposal 和模組上下文

讀取 proposal.md 並載入相關模組的 AI Knowledge。

**場景：**
- WHEN change plan 開始，THEN 讀取 proposal.md 和相關模組 READMEs
- WHEN Constitution 存在，THEN 注入為 context
- WHEN specs/capabilities/ 下有對應的 capability specs，THEN 載入現有行為需求作為 Layer 0 context

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: redesign-spec-system (2026-02-15) — 新增 capability specs 載入

### REQ-CHNG-007: 識別相關 AI Knowledge 模組

識別相關的 AI Knowledge 模組並載入對應的 README。

**場景：**
- WHEN proposal 標記了相關模組，THEN 讀取對應的 `modules/{module}/README.md`
- WHEN 模組 README 不存在，THEN 跳過該模組但發出警告

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-008: Constitution 注入

Constitution 作為 context 注入計劃生成。

**場景：**
- WHEN Constitution 存在，THEN 所有 Planning Skills 自動執行 Constitution 快速檢查（比對至少 3 條最相關原則）
- WHEN Constitution 不存在，THEN 跳過 Constitution Check

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-009: 生成 plan.md

生成結構化的實作計劃。

**場景：**
- WHEN context 載入完成，THEN plan.md 包含概述、受影響模組、實作步驟、風險評估
- WHEN 步驟超過 10 個，THEN 建議拆分為多個 Stories
- WHEN plan 包含 MODIFIED 需求，THEN 引用 capability spec 中的現有行為作為 Before

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: redesign-spec-system (2026-02-15) — MODIFIED 引用 capability spec

### REQ-CHNG-010: 生成 delta-spec.md

生成 Delta Spec，使用 ADDED/MODIFIED/REMOVED 格式和 REQ IDs。

**場景：**
- WHEN plan 生成，THEN delta-spec.md 同時建立
- WHEN 需求被列出，THEN 每個有 `REQ-{MODULE}-{NUMBER}` 格式
- WHEN 需求被新增，THEN 包含 Description、Acceptance Criteria、Priority
- WHEN 需求被修改，THEN 包含 Before、After、Reason

**新增來源**: mvp-initial (2026-02-04)

### 拆分任務（prospec change tasks）

### REQ-CHNG-011: 拆解計劃為任務

生成 tasks.md，按架構層次分組。

**場景：**
- WHEN plan.md 有效，THEN tasks.md 依架構層次分組（Types → Lib → Services → CLI → Tests）
- WHEN 任務可並行，THEN 標記 `[P]`
- WHEN design-spec.md 存在，THEN UI 任務引用具體元件名稱，並標注透過 adapter MCP 讀取精確設計後實作

**新增來源**: mvp-initial (2026-02-04)
**修改來源**: add-design-phase (2026-02-16) — Tasks Skill 讀取 design-spec.md 進行 UI 任務拆解

### REQ-CHNG-012: 架構層次排序

任務按架構層次分組。

**場景：**
- WHEN 生成 tasks.md，THEN 任務按 Types → Lib → Services → CLI → Tests 順序排列
- WHEN 變更只影響模板，THEN 使用 Templates 作為分組

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-013: 估算任務複雜度

每個任務包含估算行數。

**場景：**
- WHEN 任務生成，THEN 每個包含 `~{lines} lines` 估算
- WHEN 摘要顯示，THEN 包含總任務數和總估算行數

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-014: Checkbox 任務格式

任務使用 checkbox 格式追蹤進度。

**場景：**
- WHEN tasks.md 生成，THEN 每個任務以 `- [ ]` 開頭
- WHEN 任務完成，THEN 標記為 `- [x]`

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-015: 任務摘要統計

tasks.md 包含總任務數和總估算行數摘要。

**場景：**
- WHEN tasks.md 生成，THEN 末尾包含 Summary 區段
- WHEN 有可並行任務，THEN 摘要顯示 Parallelizable Tasks 數量

**新增來源**: mvp-initial (2026-02-04)

### REQ-CHNG-016: 計劃狀態更新

計劃生成完成後更新 metadata 狀態。

**場景：**
- WHEN 計劃生成完成，THEN `metadata.yaml` 的 `status` 更新為 `plan`
- WHEN 任務生成完成，THEN `metadata.yaml` 的 `status` 更新為 `tasks`

**新增來源**: mvp-initial (2026-02-04)

### 歸檔（prospec archive）

### REQ-TYPES-010: ChangeStatus Archived 支援

`ChangeStatus` 型別支援 `archived` 狀態。

**場景：**
- WHEN 變更歸檔，THEN metadata status 設為 `archived`
- WHEN 篩選變更，THEN `archived` 是有效的篩選值

**新增來源**: add-archive-system (2026-02-09)

### REQ-SERVICES-010: Archive Service

掃描、篩選、搬移、生成摘要。

**場景：**
- WHEN archive 執行，THEN verified 變更搬移到 `.prospec/archive/{date}-{name}/`
- WHEN 摘要生成，THEN 包含 User Story、REQ IDs、受影響模組、完成統計
- WHEN archive 完成，THEN 摘要複製到 `specs/history/`
- WHEN archive 完成，THEN 自動觸發 knowledge-update（失敗為非致命性）

**新增來源**: add-archive-system (2026-02-09)
**修改來源**: add-knowledge-update (2026-02-09) — 自動觸發 knowledge-update
**修改來源**: redesign-spec-system (2026-02-15) — 摘要輸出到 specs/history/

### REQ-TEMPLATES-010: Archive Skill 模板

Archive Skill 模板定義 5 個執行階段。

**場景：**
- WHEN archive skill 觸發，THEN 依循 Scan → Summary → Archive → Spec Sync → Knowledge Update 五階段
- WHEN Spec Sync 階段執行，THEN 讀取 delta-spec ADDED/MODIFIED/REMOVED 合併到 specs/capabilities/
- WHEN Spec Sync 失敗，THEN 歸檔仍然成功（非致命性）
- WHEN Knowledge Update 階段，THEN 從 delta-spec REQ ID 前綴提取具體受影響模組名稱
- WHEN 模組列出完成，THEN 互動式詢問「是否立即更新這些模組的 Knowledge？」

**新增來源**: add-archive-system (2026-02-09)
**修改來源**: redesign-spec-system (2026-02-15) — 新增 Phase 3.5 Spec Sync，摘要輸出到 specs/history/
**修改來源**: enhance-knowledge-sdd-pipeline (2026-02-16) — Phase 4 互動式 Knowledge Update
**修改來源**: add-design-phase (2026-02-16) — 歸檔流程同時搬移 design-spec.md 和 interaction-spec.md（若存在）

### 格式定義與規格管理

### REQ-TEMPLATES-030: 增強版 Proposal 格式參考

`proposal-format.hbs` 定義新的 proposal 結構，包含 INVEST User Stories + WHEN/THEN + 邊界案例 + FR + SC + 待釐清標記。

**場景：**
- WHEN 引用 proposal-format reference，THEN 格式包含 8+ 結構化區段（Why、User Stories、驗收場景、邊界案例、功能需求、成功指標、相關模組、備註）
- WHEN 撰寫 User Story，THEN 格式包含「作為/我希望/以便」+ Priority + 獨立測試 + WHEN/THEN
- WHEN 有未決問題，THEN 標記為「待釐清」（最多 3 個）
- WHEN 文件完成，THEN 包含 Constitution 驗證區段

**新增來源**: redesign-spec-system (2026-02-15)

### REQ-TEMPLATES-031: Capability Spec 格式參考

`capability-spec-format.hbs` 定義活的行為需求規格結構。

**場景：**
- WHEN 建立 capability spec，THEN 包含 Overview、Requirements（REQ ID + WHEN/THEN Scenarios）、邊界案例、成功指標、Change History
- WHEN 歸檔觸發 Spec Sync，THEN 依格式新增或更新 requirements
- WHEN requirement 有歷史修改，THEN Change History 記錄每次變更來源和日期

**新增來源**: redesign-spec-system (2026-02-15)

### REQ-TEMPLATES-032: New-Story Skill INVEST 引導

`prospec-new-story.hbs` 引導使用者產出符合 INVEST 原則的多個 User Stories。

**場景：**
- WHEN new-story skill 觸發，THEN 訪談流程引導定義多個獨立的 User Stories
- WHEN 收集每個 Story，THEN 收集 Priority（P0/P1/P2）和 WHEN/THEN 驗收場景
- WHEN 訪談完成，THEN 引導填寫邊界案例、功能需求和成功指標
- WHEN 產出 proposal.md，THEN 符合新版 proposal-format.hbs 格式
- WHEN Startup Loading 讀取 _index.md，THEN 比對 proposal 關鍵字與模組 keywords 欄位自動推導 Related Modules
- WHEN Phase 結尾，THEN 執行 Knowledge Quality Gate 驗證 Related Modules 識別結果

**新增來源**: redesign-spec-system (2026-02-15)
**修改來源**: enhance-knowledge-sdd-pipeline (2026-02-16) — 新增關鍵字比對 + Quality Gate

### REQ-TEMPLATES-033: Plan Skill Capability 載入

`prospec-plan.hbs` 在 Startup Loading 階段載入 capability specs。

**場景：**
- WHEN Plan Skill Startup Loading，THEN 讀取 `specs/capabilities/` 下對應的 capability specs
- WHEN delta-spec 有 MODIFIED 項目，THEN 引用 capability spec 現有行為作為 Before 欄位
- WHEN ai-knowledge/modules/ 有 >= 2 模組且 README.md 存在，THEN 偵測為 Brownfield Mode
- WHEN Brownfield Mode，THEN 自動合成 Technical Summary（受影響模組概覽 + 既有 Patterns + 架構約束）
- WHEN Greenfield Mode，THEN 引導補償性 Technical Context 收集 + 建議建立 Knowledge
- WHEN Phase 結尾，THEN 執行 Knowledge Quality Gate 驗證 context 載入完整性

**新增來源**: redesign-spec-system (2026-02-15)
**修改來源**: enhance-knowledge-sdd-pipeline (2026-02-16) — 新增 Brownfield/Greenfield 偵測 + Quality Gate

### REQ-TEMPLATES-034: Verify Skill Spec-Knowledge 一致性

`prospec-verify.hbs` 包含 Spec ↔ Knowledge 一致性驗證和條件式設計一致性檢查。

**場景：**
- WHEN verify skill 觸發，THEN 比對 capability spec requirements 與 ai-knowledge 實作描述
- WHEN 報告生成，THEN 每個 requirement 顯示 PASS/WARN/FAIL 狀態
- WHEN capability spec 有 requirement 但 ai-knowledge 無對應描述，THEN 報告 FAIL
- WHEN ai-knowledge 描述的功能在 capability spec 中沒有 requirement，THEN 報告 WARN
- WHEN ui_scope != none 且 design-spec.md 存在，THEN 執行第 6 維度「設計一致性」驗證（視覺規格 + 互動規格符合度）
- WHEN ui_scope == none 或無 design-spec.md，THEN 跳過設計一致性維度

**新增來源**: redesign-spec-system (2026-02-15)
**修改來源**: add-design-phase (2026-02-16) — 新增第 6 維度「設計一致性」條件式驗證

### ADDED in enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-040: Knowledge Quality Gate 表格

5 個 Planning Skill template 在 Core Workflow 結尾新增 Knowledge Quality Gate 區段，使用 PASS/WARN/FAIL 三級狀態表格。

**場景：**
- WHEN 任何 Planning Skill 執行完畢，THEN 顯示 Knowledge Quality Gate 表格
- WHEN 閘門檢查發現問題，THEN 以 WARN 格式輸出（不阻擋流程）
- WHEN 每個 Skill 的閘門，THEN 檢查項目因階段而異（Story: Related Modules、Plan: Context Mode、Tasks: Architecture Layers）

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-041: Plan Brownfield/Greenfield 偵測

`prospec-plan.hbs` 新增 Context Mode Detection，在載入 Knowledge 前判斷 Brownfield 或 Greenfield。

**場景：**
- WHEN ai-knowledge/modules/ 有 >= 2 模組且 README.md 存在，THEN 偵測為 Brownfield Mode
- WHEN 模組不存在或 < 2，THEN 偵測為 Greenfield Mode
- WHEN Greenfield Mode，THEN 建議執行 `prospec knowledge init` + `/prospec-knowledge-generate`

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-042: Plan Technical Summary（Brownfield）

Brownfield Mode 下，引導 AI 從 module READMEs、_conventions.md 和 Constitution 合成 Technical Summary。

**場景：**
- WHEN Brownfield Mode，THEN plan.md 包含 Technical Summary（受影響模組概覽表 + 既有 Patterns + 架構約束）
- WHEN _conventions.md 存在，THEN Patterns 區段列出 Service Pattern、Atomic Write、ContentMerger 等

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-043: Plan Technical Context（Greenfield）

Greenfield Mode 下，引導 AI 執行補償性上下文收集。

**場景：**
- WHEN Greenfield Mode，THEN plan.md 包含 Technical Context（技術棧偵測 + 結構掃描 + 外部依賴 + [待補充]標記）
- WHEN 專案有 package.json，THEN 從中推斷語言、框架和測試框架

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-044: plan-format.hbs Technical Summary 區段

`plan-format.hbs` 新增 Section 2: Technical Summary（Context-Dependent），位於 Overview 和 Affected Modules 之間。

**場景：**
- WHEN plan-format 被引用，THEN 包含 Brownfield 和 Greenfield 兩種互斥格式
- WHEN plan.md 產出，THEN 只包含其中一種格式

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-TEMPLATES-045: Verify Spec ↔ Knowledge 一致性強化

`prospec-verify.hbs` 加入 Knowledge 過期偵測指引。

**場景：**
- WHEN ai-knowledge 描述的功能在 capability spec 中沒有 requirement，THEN WARN（undocumented feature）
- WHEN 實作變更（delta-spec MODIFIED）但 module README 未更新，THEN WARN + 建議 `/prospec-knowledge-update`

**新增來源**: enhance-knowledge-sdd-pipeline (2026-02-16)

### REQ-SPECS-001: specs/ 目錄雙層結構

`prospec/specs/` 重整為雙層結構：`capabilities/`（活的需求規格）和 `history/`（歸檔摘要）。

**場景：**
- WHEN 查看 specs/，THEN 有 `capabilities/` 和 `history/` 兩個子目錄
- WHEN 歸檔產生摘要，THEN 摘要存入 `specs/history/`
- WHEN Spec Sync 執行，THEN capability specs 在 `specs/capabilities/` 中被建立或更新
- WHEN specs/ 根目錄，THEN 不再直接存放歸檔摘要

**新增來源**: redesign-spec-system (2026-02-15)

### 設計階段（Design Phase）

### REQ-TEMPLATES-050: Design Spec 格式參考

`design-spec-format.hbs` 定義平台無關的視覺設計規格結構。

**場景：**
- WHEN 引用 design-spec-format reference，THEN 包含 Visual Identity（色彩、字體、間距）、Components（佈局、狀態、token）、Responsive Strategy（斷點適配）
- WHEN 撰寫 design spec，THEN 不包含任何平台特定引用（使用 token 而非硬編碼值）

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-051: Interaction Spec 格式參考

`interaction-spec-format.hbs` 定義平台無關的互動規格結構，使用 Interaction DSL 草案語法。

**場景：**
- WHEN 引用 interaction-spec-format reference，THEN 包含 Screen/Component 定義（States、Transitions）、Flow 序列（trigger → action）、Responsive 互動差異
- WHEN DSL 語法使用，THEN 標註為 draft-1（核心概念穩定，細節可調整）

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-052: prospec-design Skill 模板

`prospec-design.hbs` 定義完整的 Design Phase 工作流程，支援 Generate 和 Extract 雙模式。

**場景：**
- WHEN design skill 觸發，THEN 讀取 proposal.md（ui_scope）和 .prospec.yaml（design.platform）偵測模式
- WHEN design-spec.md 不存在且無設計工具現有設計，THEN 進入 Generate Mode（從 proposal 產出 design-spec.md + interaction-spec.md）
- WHEN design-spec.md 已存在或設計工具有現有設計，THEN 進入 Extract Mode（透過 MCP 讀取設計、反向產出規格）
- WHEN Extract Mode 遇到無法推斷的設計意圖，THEN 標記 [NEEDS CLARIFICATION] 待使用者審閱
- WHEN Phase 3 執行，THEN 依 .prospec.yaml 指定的 platform adapter 執行設計工具操作
- WHEN Phase 4 驗證，THEN 透過截圖或結構比對驗證設計正確性

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-053: Platform Adapter — pencil.dev

`adapter-pencil.hbs` 定義 pencil.dev MCP 操作指引。

**場景：**
- WHEN Design Phase 使用 pencil adapter，THEN 使用 batch_design() 建立元件、set_variables() 設定設計 token
- WHEN Implement Phase 使用 pencil adapter，THEN 使用 batch_get() 讀取精確設計細節、get_screenshot() 取得視覺參考
- WHEN Verify Phase 使用 pencil adapter，THEN 使用 get_screenshot() + search_all_unique_properties() 比對實作

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-054: Platform Adapter — Figma

`adapter-figma.hbs` 定義 Figma 操作指引（透過 html-to-figma MCP）。

**場景：**
- WHEN Design Phase 使用 figma adapter，THEN 產出 HTML prototype → 使用 html-to-figma MCP（import-html/import-url）推送
- WHEN Implement Phase 使用 figma adapter，THEN 使用 Figma MCP 讀取設計節點詳細資訊（fills、strokes、auto-layout）
- WHEN Verify Phase 使用 figma adapter，THEN 比對 Figma 節點屬性與實作

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-055: Platform Adapter — Penpot

`adapter-penpot.hbs` 定義 Penpot API 操作指引。

**場景：**
- WHEN Design Phase 使用 penpot adapter，THEN 使用 Penpot API 建立設計元件
- WHEN Implement Phase 使用 penpot adapter，THEN 匯出 Penpot 設計為可讀格式
- WHEN Verify Phase 使用 penpot adapter，THEN API 結構比對驗證

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-056: Platform Adapter — HTML

`adapter-html.hbs` 定義純 HTML prototype 產出指引（零依賴）。

**場景：**
- WHEN Design Phase 使用 html adapter，THEN 產出 prototype/ 目錄（index.html、styles.css、各頁面 HTML）
- WHEN Implement Phase 使用 html adapter，THEN 讀取 CSS custom properties 和 HTML 結構取得精確值
- WHEN Verify Phase 使用 html adapter，THEN DOM 結構和 CSS 屬性比對

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-057: Proposal UI Scope 欄位

`proposal-format.hbs` 新增可選的 UI Scope 區段。

**場景：**
- WHEN 引用 proposal-format reference，THEN 包含 UI Scope 區段（full/partial/none 三選項）
- WHEN ui_scope 為 full，THEN 表示需要完整的新畫面設計
- WHEN ui_scope 為 partial，THEN 表示修改現有 UI 元件
- WHEN ui_scope 為 none，THEN 表示純後端變更，跳過 Design Phase
- WHEN proposal 未包含 UI Scope，THEN 舊版 proposal 不受影響

**新增來源**: add-design-phase (2026-02-16)

### REQ-TEMPLATES-058: Implement Skill MCP-First 設計讀取

`prospec-implement.hbs` 在 UI 任務的 Phase 2 和 Phase 3 新增設計感知。

**場景：**
- WHEN 實作 UI 任務，THEN Phase 2 載入 design-spec.md + interaction-spec.md + 對應 platform adapter
- WHEN Phase 3 執行 UI 任務，THEN 先透過 adapter MCP 讀取設計工具的精確值（色碼、間距、元件結構），再實作
- WHEN 無 design-spec.md，THEN 發出警告（UI 任務缺少設計規格）

**新增來源**: add-design-phase (2026-02-16)

## 邊界案例

- Archive 目錄已存在：警告使用者，詢問覆蓋或跳過
- 變更缺少 delta-spec.md：以部分摘要歸檔，Spec Sync 跳過
- Knowledge update 失敗：非致命性，建議手動更新
- 執行 `prospec change plan` 但找不到 story：提示先建立 story
- 超過 30 個任務：建議拆分 Story 或合併細粒度任務
- Spec Sync 時 capability spec 不存在：建立新的 capability spec 檔案
- Verify 時無 capability spec：跳過 Spec ↔ Knowledge 一致性檢查
- Design Skill 觸發時 .prospec.yaml 無 design.platform：預設使用 html adapter
- Extract Mode 遇到無法推斷的設計意圖：標記 [NEEDS CLARIFICATION] 待使用者審閱
- UI 任務但無 design-spec.md：Implement Skill 發出警告

## 成功指標

- **SC-001**: 所有 SDD 生命週期階段（story → plan → tasks → implement → verify → archive）產出正確格式的 artifacts
- **SC-002**: 歸檔摘要累積在 specs/history/ 提供版本控制的審計軌跡
- **SC-003**: 系統支援同時處理 5 個以上的變更 story 而不產生混淆
- **SC-007**: Prospec 可用於自身開發（self-host），證明工具的實用性

## 變更歷史

| 日期 | 變更 | 影響 | REQs |
|------|------|------|------|
| 2026-02-04 | mvp-initial | 建立變更管理工作流 | REQ-CHNG-001~016 |
| 2026-02-04 | skill-autonomy | Skills 自主建立變更目錄和骨架 | REQ-CHNG-001 |
| 2026-02-09 | add-archive-system | 新增歸檔生命週期階段 | REQ-TYPES-010, REQ-SERVICES-010, REQ-TEMPLATES-010 |
| 2026-02-09 | add-knowledge-update | Archive 自動觸發 knowledge-update | REQ-SERVICES-010 |
| 2026-02-15 | redesign-spec-system | INVEST proposal 格式、capability spec 格式、Spec Sync、specs/ 雙層結構、一致性驗證 | REQ-TEMPLATES-030~034, REQ-SPECS-001, REQ-TEMPLATES-010, REQ-CHNG-002, REQ-CHNG-006, REQ-CHNG-009 |
| 2026-02-16 | enhance-knowledge-sdd-pipeline | Knowledge Quality Gate、Brownfield/Greenfield 偵測、Technical Summary、互動式 Knowledge Update | REQ-TEMPLATES-040~045, REQ-TEMPLATES-032, REQ-TEMPLATES-033, REQ-TEMPLATES-010 |
| 2026-02-16 | add-design-phase | Design Phase Generate/Extract 雙模式、4 平台 adapter、UI Scope、設計感知 Tasks/Implement/Verify | REQ-TEMPLATES-050~058, REQ-TEMPLATES-010, REQ-CHNG-011, REQ-TEMPLATES-034 |
