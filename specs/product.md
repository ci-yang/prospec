---
product: prospec
version: 0.1.4
last_updated: 2026-03-02
---

# Prospec — Progressive Spec-Driven Development

## 願景

Prospec 是一個 AI-augmented 的 Spec-Driven Development (SDD) 框架，透過結構化的工作流程和自動生成的 AI Knowledge，讓 AI Agent 和人類開發者能高效協作完成軟體開發。核心理念：先規格、再實作、後驗證。

## 目標使用者

| 角色 | 描述 | 核心需求 |
|------|------|---------|
| AI Agent | Claude, Gemini, Copilot, Codex 等 AI 編碼助手 | 結構化的專案知識，讓每次對話都有上下文 |
| 開發者 | 使用 AI Agent 輔助開發的軟體工程師 | 可控、可追蹤的 AI 輔助開發流程 |
| 專案維護者 | 負責專案架構和品質的技術負責人 | 透明的架構決策、品質門檻、規格管理 |

## 功能地圖

### AI Knowledge — 智慧知識引擎
自動生成、持久化、版控的專案知識系統，採用 L0/L1/L2 分層載入和 Recipe-First 格式。
→ [features/ai-knowledge.md](features/ai-knowledge.md)

## 核心 User Stories 摘要

- **AI Knowledge**: AI Agent 的模組文件告訴我「什麼時候要改、怎麼改、注意什麼」，而非只列出 function

## 產品原則

1. **Spec-First** — 先定義規格，再寫程式碼
2. **AI-Augmented** — AI 和人類各司其職，AI 負責結構化產出，人類負責決策
3. **Progressive Disclosure** — 按需載入，不浪費 context window
4. **Cross-Tool** — 不綁定特定 AI 工具，純文字格式支援所有 Agent

## 路線圖概覽

| 階段 | 狀態 | 核心功能 |
|------|------|---------|
| v0.1 | Active | SDD 六階段工作流 + AI Knowledge 引擎 + 多 Agent 支援 |
| v0.2 | Planned | 專案類型適配（Frontend/Backend/Monorepo）+ 設計階段 |
| v0.3 | Planned | Knowledge 品質門檻 + 自動更新管道 |
