---
title: Zustand Slice Pattern
scope: src/domain/*/store/**, src/shared/store/**
applies_to: client-only UI state shared across components of one window
related:
  - ../structure.md
  - ../conventions/react-sections.md
  - ./react-query.md
---

# Zustand Slice Pattern

> Zustand is for **client-only UI state**, such as an open panel, a selection or a draft. Data that lives in Rust/SQLite belongs in React Query, not Zustand. Each domain exposes a `SlicePattern<DomainState, BoundState>` slice that is combined in `rootStore.ts`. `immer` and `devtools` are enabled.

- `SlicePattern` comes from a module augmentation in `src/shared/store/types.d.ts` and is imported as if from `zustand`.
- The skeleton has **no slices yet**: `rootStore.ts` starts with `BoundState = object`. The comment in that file shows how to register one.

## Adding a slice

```ts
// src/domain/notes/store/notes.state.ts
export interface NotesState {
  selectedId?: number;
  selectNote: (id?: number) => void;
}

// src/domain/notes/store/slice.ts
const createNotesSlice: SlicePattern<NotesState, BoundState> = (set) => ({
  selectedId: undefined,
  selectNote: (id) =>
    set((state) => {
      state.selectedId = id;
    }, false, 'notes/selectNote'),
});
export default createNotesSlice;

// src/shared/store/rootStore.ts
immer((...a) => ({ ...createNotesSlice(...a) }))
export type BoundState = NotesState; // NotesState & OtherState & …
```

## Rules

- **Action names:** use `domain/actionName` as the devtools action type (third `set` argument).
- **Updating state:** inside `set`, either mutate the immer draft or return a new object. Don't mix the two styles in one slice.
- **Selectors:** select the narrowest value in components (`useStore((s) => s.selectedId)`), under the `// store` section.
- **Windows:** the store is per window ([react-query](./react-query.md#multiple-windows)). State that must survive a restart or be shared between windows belongs in SQLite.
