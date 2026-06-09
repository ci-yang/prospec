# Diagram Conventions

> How to author Mermaid flow/state diagrams that live alongside AI Knowledge docs
> (e.g. `modules/{module}/*-flow.md`). Sibling of [`_module-readme-conventions.md`](_module-readme-conventions.md):
> that file governs module README structure, this one governs diagrams. Keep diagrams as a
> **Supplementary Doc** — link them from the README, do not inline large diagrams into it.

## When to add a diagram

Add a flow/state diagram only when a process is hard to follow in prose: multi-step async flows,
state machines with several terminal states, or cross-module call sequences. A small leaf module
usually needs none.

## Color Palette (classDef)

Distinguish node semantics with `classDef` colors, not emoji. Declare only the classes a diagram
actually uses, sorted alphabetically. All classes use white text except `decisionNode`.

| Class | Fill | Stroke | Semantics |
|-------|------|--------|-----------|
| `apiNode` | `#4A90D9` | `#2E6BA6` | API endpoint / request entry |
| `queueNode` | `#9013FE` | `#6B0FBE` | Async boundary (queue / stream consumed by a worker) |
| `stateNode` | `#F5A623` | `#D4871A` | In-progress / working state |
| `readyNode` | `#7ED321` | `#5CA018` | Intermediate milestone / actionable pause point |
| `successNode` | `#417505` | `#2E5204` | Terminal success |
| `failNode` | `#D0021B` | `#A80216` | Terminal failure / error state |
| `clientNode` | `#2C3E50` | `#1A252F` | Client-side / external actor action |
| `decisionNode` | `#FFF` | `#999` | Branch decision (dark grey text) |

```
classDef apiNode fill:#4A90D9,color:#fff,stroke:#2E6BA6
classDef clientNode fill:#2C3E50,color:#fff,stroke:#1A252F
classDef decisionNode fill:#fff,color:#333,stroke:#999
classDef failNode fill:#D0021B,color:#fff,stroke:#A80216
classDef queueNode fill:#9013FE,color:#fff,stroke:#6B0FBE
classDef readyNode fill:#7ED321,color:#fff,stroke:#5CA018
classDef stateNode fill:#F5A623,color:#fff,stroke:#D4871A
classDef successNode fill:#417505,color:#fff,stroke:#2E5204
```

## Node Shape

| Shape | Mermaid syntax | Use |
|-------|----------------|-----|
| Rectangle | `["text"]` | General processing step |
| Diamond | `{"text"}` | Conditional branch |
| Cylinder | `[("text")]` | Queue / stream / store |

## Label Format

- **API endpoint**: `"METHOD /path"`, e.g. `"POST /orders/{id}/submit"`
- **State node**: all-caps state name, e.g. `"DOWNLOADING"`, `"COMPLETED"`
- **Handler/method**: method name, e.g. `"_on_submit"`, `"dispatch()"`
- **Line break**: use `<br>` to separate a title from supplementary notes
- **Edge label**: event names in all caps (`ORDER_SUBMITTED`); branch conditions short (`Yes` / `No`)

## Section Structure

Within a flowchart, segment with block comments:

```
%% ═══════════════════════════════════════════
%% Section Name
%% ═══════════════════════════════════════════
```

Recommended flow-document structure: (1) a `stateDiagram-v2` global overview if applicable,
(2) segmented flowcharts split by lifecycle or entry point, (3) summary tables for path
comparisons or key design decisions.
