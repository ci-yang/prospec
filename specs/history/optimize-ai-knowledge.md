# optimize-ai-knowledge — Archive Summary

- **Archived**: 2026-03-02
- **Original Created**: 2026-02-25
- **Quality Grade**: A (Good)

## User Story

As a AI Agent（使用 prospec 輔助開發）,
I want AI Knowledge 的模組文件告訴我「什麼時候要改這個模組、怎麼改、注意什麼」,
So that 我能在實作任務時快速獲得有用的上下文，而非只看到一堆 function 列表。

## Affected Modules

| Module | Impact | Description |
|--------|--------|-------------|
| types | Medium | 新增 KnowledgeStrategy type、TokenBudget schema、KNOWLEDGE_FILE_TYPES 精簡 |
| lib | Medium | module-detector.ts 新增 domain/package 偵測模式（624 lines） |
| templates | High | module-readme.hbs 重設計 Recipe-First；index.md.hbs 加 Rationale + Loading Rules |
| services | High | knowledge.service 支援 key_exports + recipe；steering 傳遞 strategy |
| tests | Medium | 新增 knowledge strategy 和 format contract tests |

## Requirements

| REQ ID | Status | Description |
|--------|--------|-------------|
| REQ-KNOW-010 | ADDED | Recipe-First Module README 格式 |
| REQ-KNOW-011 | ADDED | Module README Token 預算（≤100 行） |
| REQ-KNOW-012 | ADDED | 模組切割理由透明化 |
| REQ-KNOW-013 | ADDED | L0/L1/L2 分層載入架構 |
| REQ-KNOW-014 | ADDED | 彈性粒度策略 |
| REQ-KNOW-004 | MODIFIED | Module README 生成格式改為 Recipe-First |
| REQ-KNOW-005 | MODIFIED | Module Index 格式加 Rationale + Loading Rules |
| REQ-KNOW-006 | MODIFIED | Dry-run Preview 含 token 預估 |

## Completion

- **Tasks**: 22/22 (100%)
- **Acceptance Criteria**: 4/4 met (SC-001~004 all PASS)

## Knowledge Update

The following module documentation may need updating:
- `prospec/ai-knowledge/modules/types/README.md`
- `prospec/ai-knowledge/modules/lib/README.md`
- `prospec/ai-knowledge/modules/templates/README.md`
- `prospec/ai-knowledge/modules/services/README.md`
- `prospec/ai-knowledge/modules/tests/README.md`
