---
name: Nested tabs & multi-instance files
about: Plan and acceptance criteria for nested tabs, multi-instance file locations, breadcrumbs and sync/duplicate tab behaviour
---

# Nested Tabs & Multi-Instance File UI

## Goal

Add a nested-tab UI model to the frontend where tabs may contain child-tabs (tabs inside tabs). Files may appear in multiple places in the tree; the UI should show how many instances exist and show breadcrumbs that can reach every instance. Support both "sync" tabs (two views that share state) and "duplicate" tabs (independent copies).

## Acceptance criteria

- A frontend UI that displays a sidebar tree of tabs with unlimited nesting.
- When a file appears in multiple nodes, the UI shows a count and a menu of breadcrumbs to jump to any instance.
- Creating a "sync" tab links two nodes to the same backing state (navigating one updates the other in real-time in the UI simulation).
- Creating a "duplicate" tab copies the state at creation time; subsequent changes are independent.
- Basic keyboard and mouse operations: add tab, add child, duplicate, create sync link, close tab, breadcrumb navigation.

## Implementation plan (high-level)

1. Add `public/` frontend scaffold with a minimal single-page UI to prototype nested tabs.
2. Implement `nestedTabs` model (in-memory) that tracks nodes, children, and file instances.
3. Implement UI: sidebar tree, breadcrumb area, instance count + instance-picker menu.
4. Add actions: add-tab, add-child, duplicate, sync-link, close, focus.
5. Add tests or manual checklist instructions for verifying sync vs duplicate behaviour.

## Notes

- This issue adds only frontend scaffolding and a light in-memory model. Persisting state or wiring to the Rust backend / Tauri is a next step.
- The UI files will be placed under `public/` for easy prototyping and testing.

## Next tasks

- Wire frontend model to backend tab APIs and persistence.
- Add visual polishing and keyboard bindings.
