# 03-keyboard: Keyboard-only operation

- Priority: P0
- Preconditions: app running, main window focused. Use `press` only, no clicks.

## Steps
1. `press cmd+,` (macOS) / `ctrl+,` (Windows) in the main window.
2. In Settings, `press tab` through every control on the General tab; snapshot after each to read the focused element.
3. Focus the selected tab and switch with `press right` / `press left` (roving tabindex: unselected tabs are not in the tab order).
4. Change theme and language using only `tab` / arrows / `return` / `space`.
5. `press escape`. Then macOS: `press cmd+w`; Windows: close button.

## Expected
- Step 1 opens the settings window, titled with the native label `settings` "Settings" / "설정" (`src-tauri/src/app/i18n.rs`).
- Step 2: every control is reachable and has a name in the tree: tabs `settings.tabs.general` "General" / "일반", `settings.tabs.updates` "Updates" / "업데이트"; rows `settings.theme`, `settings.language`, `settings.launchAtLogin`.
- Step 3 changes the selected tab (`aria-selected`) and the `tabpanel`.
- Step 4 changes take effect without a mouse.
- Step 5: `escape` has no handler in the template; record whether it does anything (known gap, not a FAIL). `cmd+w` / close button hides the settings window.

## UX checks
- Is the focus ring visible in both themes?
- Is the tab order the visual order?
