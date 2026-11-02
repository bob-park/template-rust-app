# 02-window-behavior: Resize, minimize, move

- Priority: P0
- Preconditions: app running, main window visible.

## Steps
1. `resize-window` the main window small (e.g. 400×300), then large (e.g. 1200×800). Screenshot each.
2. `minimize`, then `restore`. Snapshot.
3. `move-window` to another position (another display if `list-displays` shows one). Screenshot.
4. Open Settings (`cmd+,` / `ctrl+,`) and repeat steps 1–3 on the settings window (`--window-id`).

## Expected
- The greeting card stays centered and unclipped at every size.
- Settings tabs and rows don't overlap or overflow; the panel scrolls instead of cutting content.
- After restore, the snapshot matches the one before minimize.

## UX checks
- Is the minimum usable size sensible, or does the layout break before the OS stops resizing?
