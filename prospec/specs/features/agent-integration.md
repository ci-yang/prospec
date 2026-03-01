---
feature: agent-integration
status: active
last_updated: 2026-03-02
story_count: 5
req_count: 16
---

# Agent Integration

## Who & Why

服務使用 Prospec 的開發者與多種 AI Agent（Claude Code、Gemini CLI、Copilot 等）。Agent Integration 偵測已安裝的 AI CLI 工具、生成對應配置與 SDD Skill 檔案，使 AI Agent 在 Prospec 結構化開發流程中運作。透過三層 Progressive Disclosure 與語言中立化機制，確保 Skill 在不同 Agent 和語言環境下正確運作。

## User Stories & Behavior Specifications

### US-400: AI CLI 偵測與配置生成 [P0]

身為一名開發者，
我想要 Prospec 自動偵測已安裝的 AI CLI 工具並生成對應配置，
以便 AI Agent 能立即在 SDD 框架下工作。

**Acceptance Scenarios:**
- WHEN 執行 `prospec agent sync` THEN 偵測所有已安裝的 AI CLI
- WHEN 偵測到 Claude Code THEN 生成 CLAUDE.md
- WHEN 未偵測到任何 AI CLI THEN 顯示支援清單並提示安裝

#### REQ-AGNT-001: Detect Installed AI CLI
- WHEN `~/.claude` exists, THEN detect Claude Code
- WHEN `~/.gemini` exists, THEN detect Gemini CLI
- WHEN `--cli claude` specified, THEN only process Claude Code configuration
- WHEN no installed AI CLI detected, THEN display supported CLI list

#### REQ-AGNT-002: Auto-Detect AI CLI
- WHEN detecting Claude Code, THEN check `~/.claude` directory
- WHEN detecting Gemini CLI, THEN check `~/.gemini` directory
- WHEN detecting Copilot CLI, THEN check `~/.copilot` directory
- WHEN detecting Codex CLI, THEN check `~/.codex` directory

#### REQ-AGNT-003: Generate Claude Code CLAUDE.md
- WHEN agent sync executes, THEN CLAUDE.md generated at project root
- WHEN checking content, THEN includes Knowledge paths and available Skills list
- WHEN CLAUDE.md under 100 lines, THEN no @import (avoids token waste)

#### REQ-AGNT-006: Specify Specific CLI
- WHEN `--cli claude` specified, THEN only generate Claude Code related config
- WHEN no `--cli` specified, THEN process all detected CLIs

#### REQ-AGNT-007: Atomic Write Strategy
- WHEN write succeeds, THEN temp file renamed to target
- WHEN write fails, THEN preserve original file and report error

#### REQ-AGNT-008: Idempotent Update
- WHEN CLAUDE.md already exists, THEN update content, not create new file
- WHEN Skill directory already exists, THEN update SKILL.md, not rebuild

---

### US-401: SDD Skill 生成與管理 [P0]

身為一名開發者，
我想要 Prospec 從 .hbs 模板自動生成 SDD Skill 檔案，
以便 AI Agent 能透過 slash command 觸發結構化的 SDD 工作流程。

**Acceptance Scenarios:**
- WHEN agent sync 執行 THEN 從 .hbs 模板生成所有 Skill 檔案
- WHEN 部署到 Claude THEN 產出 SKILL.md + references/
- WHEN 模板更新後重新 sync THEN 部署反映最新模板

#### REQ-AGNT-004: Generate SDD Skills
- WHEN agent sync executes, THEN generate Skill files from .hbs templates
- WHEN deploying to Claude, THEN each Skill gets directory with SKILL.md + references/
- WHEN deploying to Copilot, THEN use .instructions.md format (inline references)

#### REQ-AGNT-011: Template as Single Source
- WHEN agent sync executes, THEN render final Skill files from .hbs templates
- WHEN template updated and re-synced, THEN deployed Skills reflect latest template

#### REQ-AGNT-012: Planning Skills Create Scaffolding
- WHEN `/prospec-new-story` triggered, THEN AI self-creates change directory and skeleton files
- WHEN `/prospec-ff` triggered, THEN AI sequentially completes story -> plan -> tasks

#### REQ-AGNT-013: Skill Reference Mapping
- WHEN agent sync executes prospec-design, THEN generates 6 reference files
- WHEN reference mapping added, THEN references/ has corresponding .md files

#### REQ-TYPES-011: Skill Definition Constants
- WHEN new Skill added, THEN SKILL_DEFINITIONS updated
- WHEN agent sync executes, THEN generates files for all defined Skills

---

### US-402: 三層 Progressive Disclosure [P0]

身為一名開發者，
我想要 Skill 採用三層漸進式揭露設計控制 token 消耗，
以便 AI Agent 只在需要時才載入深層上下文。

**Acceptance Scenarios:**
- WHEN Layer 1（名稱 + 描述）THEN 約 100 tokens
- WHEN Layer 2（SKILL.md 本體）THEN 最多 500 行
- WHEN Layer 3（references/）THEN 只在需要時載入

#### REQ-AGNT-005: Skill Progressive Disclosure Guidance
- WHEN Skill triggered, THEN AI first reads `_index.md` index
- WHEN related modules identified, THEN loads `modules/{module}/README.md`
- WHEN deeper info needed, THEN reads source code (Layer 3)

#### REQ-AGNT-009: Skill Naming Convention
- WHEN new Skill created, THEN name format is `prospec-{name}`
- WHEN deploying to .claude/skills/, THEN directory name is `prospec-{name}`

#### REQ-AGNT-010: Three-Layer Progressive Disclosure
- WHEN Layer 1 (name + description), THEN ~100 tokens
- WHEN Layer 2 (SKILL.md body), THEN max 500 lines
- WHEN Layer 3 (references/ on demand), THEN only loaded when needed

---

### US-410: Skill 語言中立化 [P1]

身為一名在 Constitution 中設定繁體中文的 Prospec 使用者，
我想要 Skill 不包含任何硬編碼的語言指令，
以便 Constitution 的語言設定不被 Skill 層級的英文輸出指令覆蓋。

**Acceptance Scenarios:**
- WHEN agent sync 生成 SKILL.md THEN 不含 `All generated files must be written in English`
- WHEN 使用者在 Constitution 指定繁體中文 THEN Skill 輸出語言遵循 Constitution

#### REQ-SKILL-009: Skill Output Language Neutrality
- WHEN agent sync generates SKILL.md, THEN contains no hardcoded language directives
- WHEN user specifies language in Constitution, THEN Skill output follows Constitution
- WHEN no language specification, THEN AI determines from conversation context

#### REQ-SKILL-010: Activation Language Neutrality
- WHEN Skill triggered, THEN Activation uses `When triggered, briefly describe:` (no language spec)
- WHEN AI executes Activation, THEN response language determined by external mechanism

---

### US-420: 多 Agent 平台支援 [P1]

身為一名同時使用多個 AI Agent 的開發者，
我想要 Prospec 為不同 Agent 平台生成對應格式的配置與 Skill，
以便在 Claude Code、Gemini CLI、Copilot 等之間無縫切換。

**Acceptance Scenarios:**
- WHEN 偵測到多個 AI CLI THEN 為每個平台生成對應格式的配置
- WHEN 部署到 Copilot THEN 使用 .instructions.md 格式
- WHEN 使用 `--cli` 指定特定平台 THEN 只生成該平台配置

_(Cross-references: REQ-AGNT-001 Detection, REQ-AGNT-004 Multi-format Generation — 完整 Scenarios 見 US-400/US-401)_

---

## Edge Cases

- 未偵測到任何 AI CLI：列出支援清單並提示安裝
- 寫入失敗（磁碟已滿、權限不足）：原子寫入，失敗時保留原始檔案
- Planning Skill 觸發時無 Constitution：跳過 Constitution Check，不阻斷流程
- 新 Agent 平台尚未支援：gracefully skip 並提示即將支援
- Skill 模板語法錯誤：渲染失敗時保留上一次部署版本

## Success Criteria

- **SC-1**: `prospec agent sync` 為所有偵測到的 Agent 生成正確配置
- **SC-2**: 部署的 Skills 與來源 .hbs 模板保持一致
- **SC-3**: AI Knowledge 節省 70%+ 的 token 消耗
- **SC-4**: 所有 11 個 Skill 通過語言中立性契約測試

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
| 2026-02-04 | mvp-initial | 建立 agent sync，支援 4 種 Agent | US-400~402, REQ-AGNT-001~012 |
| 2026-02-04 | skill-autonomy | Skills 自主建立 scaffolding | REQ-AGNT-012 |
| 2026-02-09 | add-archive-system | 新增 archive skill 定義 | REQ-TYPES-011 |
| 2026-02-09 | add-knowledge-update | 新增 knowledge-update skill | REQ-TYPES-011 |
| 2026-02-16 | add-design-phase | 新增 prospec-design + 6 reference mappings | REQ-TYPES-011, REQ-AGNT-013 |
| 2026-03-01 | remove-skill-language-directives | Skill 語言中立化 | US-410, REQ-SKILL-009~010 |
| 2026-03-02 | v2-product-first migration | 遷移至 feature spec 格式 | All |
