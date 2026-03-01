---
feature: sdd-workflow
status: active
last_updated: 2026-03-02
story_count: 10
req_count: 41
---

# SDD 開發流程

## Who & Why

**服務對象**：使用 Prospec 進行規格驅動開發（Spec-Driven Development）的開發者與團隊。

**解決的問題**：軟體開發中需求散落、規格失真、變更無追蹤、Knowledge 與實作脫節。缺乏結構化流程時，AI Agent 產出品質不穩定，專案隨時間累積技術債卻無從驗證。

**為什麼重要**：SDD Workflow 是 Prospec 的核心價值主張 — 透過 Story → Plan → Tasks → Implement → Verify → Archive 六階段生命週期，讓每一次變更都有完整的規格追蹤、品質閘門和知識沉澱。規格是活的（Living Spec），Knowledge 隨專案演進同步更新，形成正向飛輪。

---

## US-1: 建立變更需求 [P0]

身為一個使用 Prospec 的開發者，
我想要透過 `/prospec-new-story` 建立結構化的變更需求，
以便用 INVEST 格式清楚描述使用者故事、驗收條件和功能需求。

**Acceptance Scenarios:**
- WHEN 執行 `prospec change story {name}` THEN 建立 `.prospec/changes/{name}/` 含 `proposal.md` 和 `metadata.yaml`（status: story）
- WHEN 變更名稱已存在 THEN 提示已存在並終止
- WHEN 描述需求時 THEN 引導撰寫多個獨立 INVEST User Story（含優先級和 WHEN/THEN 驗收場景）

### Behavior Specifications

#### REQ-CHNG-001: Create Change Directory
建立 `.prospec/changes/{name}/` 目錄結構。
- WHEN executes, THEN create directory with `proposal.md` and `metadata.yaml`
- WHEN directory already exists, THEN prompt and exit

#### REQ-CHNG-002: Generate proposal.md
生成含 INVEST User Story 格式的 proposal.md。
- WHEN completes, THEN contains multiple INVEST User Stories + acceptance scenarios
- WHEN `--description` provided, THEN written to Notes section
- WHEN referencing proposal-format, THEN includes Why, User Stories, Edge Cases, FR, SC, Open Questions

#### REQ-CHNG-003: Auto-Identify Related Modules
透過關鍵字比對 `_index.md` 識別相關模組。
- WHEN change name contains module keywords, THEN Related Modules lists matches
- WHEN no match, THEN Related Modules is empty

#### REQ-CHNG-004: Change Metadata Lifecycle
透過 metadata.yaml 追蹤狀態：`story` → `plan` → `tasks` → `verified` → `archived`。

#### REQ-CHNG-005: Prevent Duplicate Changes
- WHEN change name already exists, THEN prompt and exit

#### REQ-TEMPLATES-032: New-Story Skill INVEST Guidance
`prospec-new-story.hbs` 引導產出 INVEST User Stories。
- WHEN triggered, THEN interview flow guides multiple independent Stories with P0/P1/P2 + WHEN/THEN
- WHEN complete, THEN conform to proposal-format.hbs + execute Knowledge Quality Gate

---

## US-2: 生成實作計劃 [P0]

身為一個使用 Prospec 的開發者，
我想要從 proposal.md 自動生成結構化的實作計劃和規格變更單，
以便清楚知道要改哪些模組、步驟為何、以及每個需求的 REQ ID 追蹤。

**Acceptance Scenarios:**
- WHEN 執行 `/prospec-plan` THEN 讀取 proposal.md + Knowledge 產出 plan.md 和 delta-spec.md
- WHEN delta-spec 生成 THEN 每個需求有 `REQ-{MODULE}-{NUMBER}` 格式 ID
- WHEN 步驟超過 10 個 THEN 建議拆分為多個 Story

### Behavior Specifications

#### REQ-CHNG-006: Load Proposal and Module Context
- WHEN starts, THEN read proposal.md + related module READMEs
- WHEN Constitution exists, THEN inject as context
- WHEN matching capability specs exist, THEN load as Layer 0 context

#### REQ-CHNG-007: Identify Related AI Knowledge Modules
- WHEN proposal marks related modules, THEN read `modules/{module}/README.md`
- WHEN module README missing, THEN skip with warning

#### REQ-CHNG-008: Constitution Injection
- WHEN Constitution exists, THEN Planning Skills auto-execute quick check (>= 3 principles)
- WHEN absent, THEN skip

#### REQ-CHNG-009: Generate plan.md
- WHEN context loaded, THEN includes Overview, Affected Modules, Steps, Risk Assessment
- WHEN steps > 10, THEN suggest splitting Stories
- WHEN MODIFIED requirements, THEN reference Before from capability spec

#### REQ-CHNG-010: Generate delta-spec.md
- WHEN plan generated, THEN delta-spec.md created with ADDED/MODIFIED/REMOVED
- WHEN added, THEN includes Description, Acceptance Criteria, Priority
- WHEN modified, THEN includes Before, After, Reason

---

## US-3: 智慧 Context 載入 [P1]

身為一個使用 Prospec 的開發者，
我想要 Plan 階段能自動偵測 Brownfield/Greenfield 並調整 context 策略，
以便既有專案利用 Knowledge 產出精準計劃，全新專案引導補償性 context 收集。

**Acceptance Scenarios:**
- WHEN `ai-knowledge/modules/` >= 2 個含 README.md THEN Brownfield Mode + 自動合成 Technical Summary
- WHEN < 2 個模組 THEN Greenfield Mode + 引導補償性 context 收集

### Behavior Specifications

#### REQ-TEMPLATES-033: Plan Skill Capability Loading
- WHEN Startup Loading, THEN read capability specs + detect Context Mode
- WHEN Brownfield, THEN synthesize Technical Summary (module overview + patterns + constraints)
- WHEN Greenfield, THEN guide compensatory collection + suggest Knowledge generation
- WHEN Phase ends, THEN execute Knowledge Quality Gate

#### REQ-TEMPLATES-041: Plan Brownfield/Greenfield Detection
- WHEN >= 2 modules with README.md, THEN Brownfield Mode
- WHEN < 2, THEN Greenfield Mode + suggest `prospec knowledge init`

#### REQ-TEMPLATES-042: Plan Technical Summary (Brownfield)
- WHEN Brownfield, THEN plan.md includes module overview table + existing patterns + architecture constraints

#### REQ-TEMPLATES-043: Plan Technical Context (Greenfield)
- WHEN Greenfield, THEN plan.md includes tech stack detection + structure scan + [TBD] markers

#### REQ-TEMPLATES-044: plan-format.hbs Technical Summary Section
- WHEN referenced, THEN includes Brownfield/Greenfield mutually exclusive formats
- WHEN produced, THEN only one format appears

---

## US-4: 拆解任務清單 [P0]

身為一個使用 Prospec 的開發者，
我想要將實作計劃自動拆解為按架構層排序的可執行任務清單，
以便逐步實作、追蹤進度、估算工作量。

**Acceptance Scenarios:**
- WHEN 執行 `/prospec-tasks` THEN tasks.md 按架構層分組（Types → Lib → Services → CLI → Tests）
- WHEN 任務可並行 THEN 標記 `[P]`
- WHEN 每個任務 THEN 含 `~{lines} lines` 複雜度估算和 checkbox 格式

### Behavior Specifications

#### REQ-CHNG-011: Decompose Plan into Tasks
- WHEN plan.md valid, THEN tasks.md groups by architecture layer
- WHEN parallelizable, THEN mark `[P]`
- WHEN design-spec.md exists, THEN UI tasks annotated for MCP design reading

#### REQ-CHNG-012: Architecture Layer Ordering
排序：Types → Lib → Services → CLI → Tests；僅 templates 變更時用 Templates 分組。

#### REQ-CHNG-013: Estimate Task Complexity
每個任務含 `~{lines} lines` 估算，Summary 含總數。

#### REQ-CHNG-014: Checkbox Task Format
任務以 `- [ ]` 起始，完成標記 `- [x]`。

#### REQ-CHNG-015: Task Summary Statistics
tasks.md 末尾含 Summary 區段（total tasks、total lines、parallelizable count）。

#### REQ-CHNG-016: Plan Status Update
- WHEN plan complete, THEN metadata status → `plan`
- WHEN tasks complete, THEN metadata status → `tasks`

---

## US-5: 驗證實作合規性 [P0]

身為一個使用 Prospec 的開發者，
我想要在實作完成後執行全面驗證，確認規格合規性、Constitution 遵循和 Knowledge 一致性，
以便歸檔前確保品質達標。

**Acceptance Scenarios:**
- WHEN 執行 `/prospec-verify` THEN 比對 capability spec 需求與 ai-knowledge 描述
- WHEN 每個需求 THEN 顯示 PASS/WARN/FAIL
- WHEN `ui_scope != none` 且有 design-spec.md THEN 額外執行設計一致性驗證

### Behavior Specifications

#### REQ-TEMPLATES-034: Verify Skill Spec-Knowledge Consistency
- WHEN triggered, THEN compare capability spec vs ai-knowledge descriptions
- WHEN spec has req but knowledge missing, THEN FAIL
- WHEN knowledge describes undocumented feature, THEN WARN
- WHEN ui_scope != none + design-spec.md exists, THEN execute design consistency check

#### REQ-TEMPLATES-045: Verify Knowledge Staleness Detection
- WHEN delta-spec MODIFIED but module README not updated, THEN WARN + suggest `/prospec-knowledge-update`

---

## US-6: 歸檔已完成變更 [P0]

身為一個使用 Prospec 的開發者，
我想要透過 `/prospec-archive` 歸檔已完成的變更，
以便 `.prospec/changes/` 保持乾淨，SDD 生命週期正確關閉，累積稽核軌跡。

**Acceptance Scenarios:**
- WHEN 執行 `/prospec-archive` THEN 掃描 verified 變更搬至 `.prospec/archive/{date}-{name}/`
- WHEN 歸檔完成 THEN 生成 summary.md 複製到 `specs/history/` + 自動觸發 knowledge-update
- WHEN Spec Sync THEN 讀取 delta-spec ADDED/MODIFIED/REMOVED 合併至 `specs/capabilities/`

### Behavior Specifications

#### REQ-TYPES-010: ChangeStatus Archived Support
`archived` 為有效的 ChangeStatus 值。

#### REQ-SERVICES-010: Archive Service
- WHEN executes, THEN verified changes moved to `.prospec/archive/{date}-{name}/`
- WHEN summary generated, THEN includes User Story, REQ IDs, modules, statistics
- WHEN complete, THEN summary → `specs/history/` + auto-trigger knowledge-update (non-fatal)

#### REQ-TEMPLATES-010: Archive Skill Template
5 階段流程：Scan → Summary → Archive → Spec Sync → Knowledge Update。
- WHEN Spec Sync, THEN merge delta-spec to specs/capabilities/ (non-fatal on failure)
- WHEN Knowledge Update, THEN extract module names from REQ ID prefixes + interactively ask update
- WHEN archiving, THEN also move design-spec.md + interaction-spec.md if exist

---

## US-7: 活規格系統 [P0]

身為一個使用 Prospec 的開發者，
我想要 `specs/` 成為隨每次歸檔自動累積的活行為規格，proposal.md 完整表達 User Scenarios 和驗收條件，
以便規格真正成為 SDD 的 Single Source of Truth。

**Acceptance Scenarios:**
- WHEN 建立 capability spec THEN 含 Overview、Requirements（REQ ID + WHEN/THEN）、Edge Cases、Change History
- WHEN Archive 觸發 Spec Sync THEN 依格式新增或更新 requirements
- WHEN 查看 `specs/` THEN 有 `capabilities/` 和 `history/` 兩層

### Behavior Specifications

#### REQ-TEMPLATES-030: Enhanced Proposal Format Reference
`proposal-format.hbs` 含 8+ 區段：Why, User Stories, Acceptance Scenarios, Edge Cases, FR, SC, Related Modules, Notes。
- WHEN writing Story, THEN "As a/I want/So that" + Priority + WHEN/THEN
- WHEN open questions, THEN max 3 items

#### REQ-TEMPLATES-031: Capability Spec Format Reference
`capability-spec-format.hbs` 定義活規格結構：Overview, Requirements, Edge Cases, SC, Change History。
- WHEN archive triggers Spec Sync, THEN add/update per format

#### REQ-SPECS-001: specs/ Directory Structure
雙層結構：`capabilities/`（活規格）+ `history/`（歸檔摘要），根目錄不直接存放歸檔。

#### REQ-TEMPLATES-057: Proposal UI Scope Field
UI Scope 可選欄位（full/partial/none），none 時跳過 Design Phase，legacy proposals 不受影響。

#### REQ-REF-001: Reference Format Document Language Neutrality
Reference documents 僅定義結構（英文 headings），不強制內容語言。語言由 Constitution 控制。

---

## US-8: Knowledge 品質閘門 [P1]

身為一個使用 Prospec 的開發者，
我想要每個 SDD 階段都有品質閘門檢查 Knowledge 載入品質，
以便 AI 產出更精準的 artifacts。

**Acceptance Scenarios:**
- WHEN 任何 Planning Skill 完成 THEN 顯示 PASS/WARN/FAIL 品質閘門表格
- WHEN 發現問題 THEN WARN（非阻塞）
- WHEN 各 Skill THEN 檢查項依階段不同（Story: Related Modules, Plan: Context Mode, Tasks: Architecture Layers）

### Behavior Specifications

#### REQ-TEMPLATES-040: Knowledge Quality Gate Table
5 個 Planning Skill 在 Core Workflow 結束時顯示三態閘門表格，各 Skill 檢查項不同。

---

## US-9: 設計階段 [P1]

身為一個使用 Prospec 的開發者，
我想要從 proposal 產出視覺與互動規格（Generate），或從設計工具反向萃取規格（Extract），
以便設計規格成為實作的精確依據。

**Acceptance Scenarios:**
- WHEN 無 design-spec.md 且無設計工具設計 THEN Generate Mode
- WHEN 有 design-spec.md 或設計工具設計 THEN Extract Mode
- WHEN 完成 THEN 產出 design-spec.md + interaction-spec.md
- WHEN 實作 UI 任務 THEN MCP-First 讀取設計精確值

### Behavior Specifications

#### REQ-TEMPLATES-050: Design Spec Format Reference
`design-spec-format.hbs` — 平台無關視覺規格：Visual Identity, Components, Responsive Strategy，使用 tokens 非 hardcoded。

#### REQ-TEMPLATES-051: Interaction Spec Format Reference
`interaction-spec-format.hbs` — Interaction DSL (draft-1)：Screen/Component States, Transitions, Flow sequences。

#### REQ-TEMPLATES-052: prospec-design Skill Template
- WHEN triggered, THEN detect mode via proposal.md (ui_scope) + .prospec.yaml (design.platform)
- WHEN Generate, THEN produce specs from proposal
- WHEN Extract, THEN read via MCP + reverse-produce specs; ambiguous → [NEEDS CLARIFICATION]
- WHEN Phase 4, THEN verify via screenshot or structural comparison

#### REQ-TEMPLATES-053~056: Platform Adapters (pencil / Figma / Penpot / HTML)
4 個平台 adapter 各定義 Design/Implement/Verify 三階段的 MCP 操作指引：
- **pencil**: batch_design(), set_variables(), batch_get(), get_screenshot()
- **Figma**: HTML prototype → html-to-figma MCP, node detail reading, property comparison
- **Penpot**: Penpot API create/export/compare
- **HTML**: prototype/ directory (zero deps), CSS custom properties, DOM comparison

#### REQ-TEMPLATES-058: Implement Skill MCP-First Design Reading
- WHEN UI task, THEN Phase 2 loads design specs + adapter; Phase 3 reads precise values via MCP first
- WHEN no design-spec.md, THEN warn

---

## US-10: 快速前進模式 [P2]

身為一個需求明確的開發者，
我想要一次生成所有 planning artifacts（story → plan → tasks），
以便需求清楚時快速推進，不必逐步觸發三個 skill。

**Acceptance Scenarios:**
- WHEN 執行 `/prospec-ff` THEN 依序執行 story → plan → tasks
- WHEN 任一階段失敗 THEN 停止並回報進度
- WHEN 全部完成 THEN metadata.yaml status: `tasks`

---

## Edge Cases

- Archive 目錄已存在：警告，詢問覆蓋或跳過
- 變更缺少 delta-spec.md：部分摘要歸檔，Spec Sync 跳過
- Knowledge update 失敗：非致命，建議手動更新
- 無 story 就執行 plan：提示先建立 story
- 超過 30 個任務：建議拆分 Story 或合併
- Spec Sync 時 capability spec 不存在：建立新檔
- Verify 無 capability spec：跳過一致性檢查
- Design Skill 無 design.platform 設定：預設 html adapter
- Extract Mode 模糊設計意圖：標記 [NEEDS CLARIFICATION]
- UI 任務無 design-spec.md：Implement Skill 警告

## Success Criteria

- **SC-001**: 所有 SDD 階段（story → design → plan → tasks → implement → verify → archive）產出格式正確的 artifacts
- **SC-002**: 歸檔摘要累積在 specs/history/ 提供版本控制的稽核軌跡
- **SC-003**: 支援 5+ 個並行 change story 而不混淆
- **SC-004**: Prospec 可用於自身開發（self-host），驗證工具實用性

---

## Change History

| Date | Change | Impact | Stories/REQs |
|------|--------|--------|--------------|
| 2026-02-04 | mvp-initial | 建立變更管理核心流程 | US-1, US-2, US-4; REQ-CHNG-001~016 |
| 2026-02-09 | add-archive-system | 新增歸檔生命週期階段 | US-6; REQ-TYPES-010, REQ-SERVICES-010, REQ-TEMPLATES-010 |
| 2026-02-15 | redesign-spec-system | INVEST proposal、capability spec、Spec Sync、一致性驗證 | US-5, US-7; REQ-TEMPLATES-030~034, REQ-SPECS-001 |
| 2026-02-16 | enhance-knowledge-sdd-pipeline | Quality Gate、Brownfield/Greenfield、Technical Summary | US-3, US-8; REQ-TEMPLATES-040~045 |
| 2026-02-16 | add-design-phase | Design Phase 雙模式、4 平台 adapter、UI Scope | US-9; REQ-TEMPLATES-050~058 |
| 2026-03-01 | remove-skill-language-directives | Reference format 語言中立性 | US-7; REQ-REF-001 |
| 2026-03-02 | v2-product-first migration | 重組為 product-first feature spec | All |
