# 03-keyboard: Keyboard-only operation

- Priority: P0
- Preconditions: app running, main window focused. Use `press` only, no clicks.

## Steps
1. `press cmd+,` (macOS) / `ctrl+,` (Windows) in the main window.
2. In Settings, `press tab` through every control; snapshot after each to read the focused element.
3. Switch tabs with the keyboard (arrow keys or `tab` + `return`, whichever the tab list exposes).
4. Change theme and language using only `tab` / arrows / `return` / `space`.
5. `press escape`, then `press cmd+w` / `ctrl+w`.

## Expected
- Step 1 opens the settings window, titled `settings.title` "Settings" / "설정".
- Step 2: every control is reachable and has a name in the tree: tabs `settings.tabs.general` "General" / "일반", `settings.tabs.updates` "Updates" / "업데이트"; rows `settings.theme`, `settings.language`, `settings.launchAtLogin`.
- Step 3 changes the selected tab (`aria-selected`) and the `tabpanel`.
- Step 4 changes take effect without a mouse.
- Step 5 closes (hides) the settings window.

## UX checks
- Is the focus ring visible in both themes?
- Is the tab order the visual order?
