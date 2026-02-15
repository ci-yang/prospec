# Platform Adapter: pencil.dev

MCP-based design tool adapter for pencil.dev (.pen files).

**Requires:** `pencil` MCP server configured in `.mcp.json`

---

## Design Phase

Create design components and set design tokens in a .pen file.

### Setup

1. Use `get_editor_state()` to check if a .pen file is open
2. If no file open, use `open_document('new')` to create one or `open_document(filePath)` to open existing
3. Use `get_guidelines(topic)` for design rules (available topics: `code`, `table`, `tailwind`, `landing-page`)
4. Use `get_style_guide_tags` + `get_style_guide(tags)` for design inspiration

### Creating Components

Use `batch_design(operations)` with these operations:

| Operation | Syntax | Purpose |
|-----------|--------|---------|
| Insert | `foo=I("parent", { ... })` | Create new node |
| Copy | `baz=C("nodeid", "parent", { ... })` | Clone existing node |
| Replace | `foo2=R("nodeid", { ... })` | Replace node properties |
| Update | `U("nodeid", { ... })` | Update node properties |
| Delete | `D("nodeid")` | Remove node |
| Move | `M("nodeid", "parent", index)` | Reorder nodes |
| Image | `G("nodeid", "ai", "prompt")` | Generate image |

**Limit:** Maximum 25 operations per `batch_design()` call.

### Setting Design Tokens

Use `set_variables()` to define design tokens (colors, spacing, typography) as .pen file variables. This ensures consistency across all components.

### Tips

- Use `find_empty_space_on_canvas(direction, size)` before inserting new frames
- Use `snapshot_layout()` to check computed layout before placing elements
- Use `get_screenshot()` periodically to validate visual output

---

## Implement Phase

Read precise design values from .pen files for implementation.

### Reading Design Data

1. Use `batch_get(patterns)` to search for components by name or pattern
2. Use `batch_get(nodeIds)` to read specific node properties (colors, spacing, dimensions)
3. Use `get_variables()` to read all design tokens and their resolved values
4. Use `get_screenshot()` to capture visual reference for a specific node

### Workflow

```
1. Read design-spec.md to identify component names
2. batch_get(patterns=["ComponentName"]) → find node IDs
3. batch_get(nodeIds=[...]) → read exact properties (fill, stroke, padding, font)
4. get_variables() → read design token values
5. Implement using exact values from MCP, not approximate values from markdown
```

**Important:** MCP values are more precise than design-spec.md descriptions. Always prefer MCP-read values for colors, spacing, font sizes, and dimensions.

---

## Verify Phase

Compare implementation against design using visual and structural checks.

### Visual Comparison

1. Use `get_screenshot()` to capture the design for each component
2. Compare screenshot with implemented UI (side-by-side or overlay)
3. Check: colors match, spacing is consistent, typography is correct

### Structural Comparison

1. Use `batch_get(nodeIds)` to read component structure
2. Use `search_all_unique_properties(parentIds)` to enumerate all properties
3. Compare design structure with implementation DOM/component structure
4. Flag discrepancies in spacing, color, or layout

### Verification Checklist

- [ ] All design tokens from `get_variables()` match implementation CSS variables
- [ ] Component visual states match design (hover, active, disabled)
- [ ] Responsive breakpoints produce correct layout changes
- [ ] Typography (font family, size, weight, line-height) matches design
