# Interaction Spec Format Reference

This document defines the expected format for `interaction-spec.md`, used by the **prospec-design** Skill.

---

## Purpose

`interaction-spec.md` captures platform-agnostic interaction behaviors using a draft Interaction DSL. It defines how users move through screens, trigger actions, and experience state transitions.

**Note:** The DSL syntax below is a **draft** — core concepts (States, Transitions, Flows) are stable, but exact syntax may evolve in future versions.

---

## Standard Format

### 1. Header

```markdown
# Interaction Spec: [Story Name]

> Generated from: proposal.md + design-spec.md
> DSL Version: draft-1
> Last updated: [date]
```

---

### 2. Screen / Component Definitions

Define the interactive states and transitions for each screen or component.

```markdown
## Screens

### Screen: [ScreenName]

**States:**

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| Empty | No data loaded | Initial visit, no items |
| Loading | Fetching data | On enter / on refresh |
| Loaded | Data displayed | Fetch success |
| Error | Fetch failed | Fetch error |

**Transitions:**

```
Empty -> Loading : on enter
Loading -> Loaded : fetch success
Loading -> Error : fetch error
Error -> Loading : retry click
Loaded -> Loading : pull refresh
```
```

---

### 3. Interaction Flows

Define user journeys as sequences of trigger → action pairs.

```markdown
## Flows

### Flow: [FlowName]

**Description:** [What the user is trying to accomplish]

**Steps:**

```
1. User taps [element]
   -> Navigate to [ScreenName]
   -> Show loading indicator

2. System fetches [data]
   -> On success: render [component] with [data]
   -> On error: show [ErrorState] with retry

3. User fills [form]
   -> Validate on blur
   -> Enable submit when valid

4. User taps submit
   -> Disable button, show spinner
   -> On success: navigate to [Screen], show toast "[message]"
   -> On error: show inline error, re-enable button
```
```

---

### 4. Gestures & Micro-interactions

```markdown
## Gestures

| Element | Gesture | Action |
|---------|---------|--------|
| List item | Swipe left | Reveal delete action |
| Card | Long press | Enter selection mode |
| Image | Pinch | Zoom in/out |

## Micro-interactions

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Button tap | Scale down 0.95 → 1.0 | 100ms |
| Page enter | Fade in + slide up 8px | 200ms |
| Toast appear | Slide in from top | 150ms |
```

---

### 5. Responsive Interaction Differences

```markdown
## Responsive Interactions

| Interaction | Mobile | Desktop |
|-------------|--------|---------|
| Navigation | Swipe between tabs | Click sidebar items |
| Item selection | Tap to open | Hover preview + click |
| Context menu | Long press | Right click |
| Form submission | Sticky bottom button | Inline button |
```

---

## Guidelines

- **No platform-specific references** — describe behaviors, not implementations
- **States are exhaustive** — cover empty, loading, loaded, error, and edge states
- **Flows are user-centric** — write from the user's perspective, not the system's
- **Draft DSL** — the `->` trigger syntax is a convention, not a strict grammar; prioritize clarity over formalism
- **Keep flows focused** — one flow per user goal, 3-7 steps per flow
